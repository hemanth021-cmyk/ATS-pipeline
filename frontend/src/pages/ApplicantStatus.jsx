import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Title, Label, Body, Button, TextField, TonalContainer } from '../components/UI';

function useNowTick(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function formatRemaining(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function canWithdraw(status) {
  return !['hired', 'rejected', 'withdrawn'].includes(status);
}

export function ApplicantStatus() {
  const [searchParams] = useSearchParams();
  const rawId = searchParams.get('id');
  const applicationId = rawId ? Number.parseInt(rawId, 10) : NaN;
  const validId = Number.isFinite(applicationId) && applicationId > 0;

  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');

  const statusQuery = useQuery({
    queryKey: ['publicStatus', validId ? applicationId : null],
    queryFn: async () => {
      const { data } = await api.get(`/applications/${applicationId}/status`);
      return data;
    },
    enabled: validId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const data = statusQuery.data;
  const ackPending = Boolean(data?.status === 'ack_pending');
  const now = useNowTick(Boolean(ackPending && data?.ack_deadline));

  const remainingMs = useMemo(() => {
    if (!data?.ack_deadline) return null;
    return new Date(data.ack_deadline).getTime() - now;
  }, [data?.ack_deadline, now]);

  const invalidate = useCallback(() => {
    if (!validId) return;
    queryClient.invalidateQueries({ queryKey: ['publicStatus', applicationId] });
  }, [queryClient, validId, applicationId]);

  const ackMutation = useMutation({
    mutationFn: () =>
      api.post(`/applications/${applicationId}/acknowledge`, { applicant_email: email.trim() }),
    onSuccess: () => {
      setFormError('');
      setEmail('');
      invalidate();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || err.message || 'Verification failed');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      api.post(`/applications/${applicationId}/withdraw`, { applicant_email: email.trim() }),
    onSuccess: () => {
      setFormError('');
      setEmail('');
      invalidate();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || err.message || 'Verification failed');
    },
  });

  if (!validId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-error/10 flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-error text-[32px]">link_off</span>
          </div>
          <Title className="text-display-sm font-black tracking-tighter">Instance Not Found</Title>
          <p className="text-on-surface-variant font-medium opacity-60 leading-relaxed">
            The identification code in your URL is missing or invalid. Please refer to your confirmation email for the verified link.
          </p>
          <div className="pt-8 opacity-40">
            <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-colors">
              Systems Authentication →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-secondary/20">
      {/* Concierge Header */}
      <nav className="p-8 lg:p-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20">
              <span className="material-symbols-outlined text-on-secondary text-[18px]">verified</span>
            </div>
            <Title size="sm" className="font-black tracking-tighter">CONCIERGE</Title>
          </div>
          <button 
            onClick={() => statusQuery.refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full hover:bg-surface-container-highest transition-all group"
            disabled={statusQuery.isFetching}
          >
            <span className={`material-symbols-outlined text-[18px] opacity-40 group-hover:opacity-100 ${statusQuery.isFetching ? 'animate-spin' : ''}`}>sync</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Live Status</span>
          </button>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-8 py-12 lg:py-20 space-y-12">
        {statusQuery.isLoading ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-4 opacity-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Label className="uppercase tracking-[0.2em] font-black text-[10px]">Synchronizing...</Label>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Applicant Profile Card */}
            <div className="mb-12">
              <Label className="uppercase tracking-[0.3em] font-black text-[10px] opacity-40 mb-3 block">Perspective / Candidate Portfolio</Label>
              <h1 className="text-[3.5rem] font-black tracking-tighter leading-none mb-4">
                {data?.applicant_name || 'Anonymous'}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-xl font-bold opacity-30 tracking-tight">Applying for <span className="text-on-surface opacity-100">{data?.job_title}</span></p>
                <div className="h-4 w-[1px] bg-on-surface/10" />
                <StatusBadge status={data?.status} />
              </div>
            </div>

            {/* Status Specific Experience */}
            <TonalContainer className="p-10 rounded-[3rem] bg-surface-container-low shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-8">
                {data.status === 'withdrawn' ? (
                  <div className="text-center space-y-4 py-8">
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant/20">logout</span>
                    <Title className="font-black tracking-tight">Withdrawal Confirmed</Title>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed opacity-60">
                      Your application has been successfully removed from our active and queued systems.
                    </p>
                  </div>
                ) : data.status === 'hired' ? (
                  <div className="text-center space-y-6 py-8">
                    <div className="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto shadow-inner">
                      <span className="material-symbols-outlined text-tertiary text-[40px] animate-bounce">celebration</span>
                    </div>
                    <div className="space-y-2">
                      <Title className="text-display-sm font-black tracking-tighter">Congratulations</Title>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-tertiary">Offer Formalized</p>
                    </div>
                    <p className="text-sm font-medium leading-relaxed max-w-sm mx-auto opacity-70">
                      Our hiring board has finalized your selection. Please expect an official onboarding suite via your registered email shortly.
                    </p>
                  </div>
                ) : data.status === 'rejected' ? (
                  <div className="text-center space-y-4 py-8">
                    <span className="material-symbols-outlined text-[64px] opacity-10">layers_clear</span>
                    <Title className="font-black tracking-tight">Review Concluded</Title>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed opacity-60">
                      While we appreciated your profile, our team is pursuing other candidates at this specific junction.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Active/Waitlisted/AckPending States */}
                    <div className="grid grid-cols-1 gap-8">
                      {data.status === 'waitlisted' && (
                        <div className="flex flex-col items-center text-center p-8 bg-surface-container-highest/20 rounded-[2rem]">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4">Current Queue Index</span>
                          <span className="text-[5rem] font-black tracking-tighter leading-none text-secondary">
                            #{data.waitlist_position}
                          </span>
                          <p className="text-[12px] font-bold opacity-60 max-w-[200px] mt-4">
                            Auto-promoting as soon as the pipeline breathes.
                          </p>
                        </div>
                      )}

                      {ackPending && (
                        <div className="flex flex-col items-center text-center p-8 bg-primary/5 rounded-[2rem] border border-primary/10">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Promotional Window Closing</span>
                          <span className="text-[4rem] font-black tracking-tighter leading-none font-mono">
                            {remainingMs != null && remainingMs > 0 ? formatRemaining(remainingMs) : '0:00'}
                          </span>
                          <p className="text-[12px] font-bold text-primary/60 mt-4">
                            Confirm your entry to avoid expiration risk.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Verification Actions */}
                    <div className="space-y-6 pt-6 border-t border-surface-container">
                      <TextField
                        label="Identity Verification"
                        placeholder="verified-applicant@email.com"
                        type="email"
                        icon="fingerprint"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      
                      {formError && (
                        <div className="p-4 bg-error-container/10 rounded-2xl">
                          <p className="text-[10px] font-bold text-error uppercase tracking-widest text-center">{formError}</p>
                        </div>
                      )}

                      <div className="flex flex-col gap-4">
                        {ackPending && (
                          <Button
                            variant="secondary"
                            onClick={() => ackMutation.mutate()}
                            disabled={ackMutation.isPending || withdrawMutation.isPending}
                            loading={ackMutation.isPending}
                            className="w-full py-4 text-[12px] font-black uppercase tracking-widest"
                          >
                            Claim Promotion
                          </Button>
                        )}
                        <Button
                          variant="tertiary"
                          className={`w-full py-4 text-[12px] font-black uppercase tracking-widest ${canWithdraw(data.status) ? '' : 'hidden'}`}
                          onClick={() => {
                            if (!window.confirm('Permanent application purge? This action cannot be reversed.')) return;
                            withdrawMutation.mutate();
                          }}
                          disabled={ackMutation.isPending || withdrawMutation.isPending}
                          loading={withdrawMutation.isPending}
                        >
                          Withdraw Instance
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Background Flair */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
            </TonalContainer>
          </div>
        )}
        
        <footer className="text-center pt-8 opacity-20">
          <Link to="/login" className="text-[9px] font-black uppercase tracking-[0.4em] hover:text-on-surface transition-colors">
            Flux Systems Integration
          </Link>
        </footer>
      </main>
    </div>
  );
}
