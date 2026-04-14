import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import ThemeToggle from '../components/ThemeToggle';

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

/**
 * Public applicant page — `/status?id=<applicationId>` (spec).
 * Fetch on load + manual refresh only (no polling).
 */
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
      setFormError(err.response?.data?.error || err.message || 'Failed');
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
      setFormError(err.response?.data?.error || err.message || 'Failed');
    },
  });

  if (!validId) {
    return (
      <div className="auth-page">
        <div className="auth-card applicant-status">
          <h1>Application status</h1>
          <p className="error">
            Missing or invalid <code>id</code> in the URL.
          </p>
          <p className="muted">
            Use the link from your email, e.g. <code>/status?id=123</code>
          </p>
          <p>
            <Link to="/login">Company login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page applicant-status-page">
      <div className="auth-card applicant-status">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div>
              <h1>Your application</h1>
              <p className="muted">Updates when you refresh — we don&apos;t auto-poll.</p>
            </div>
            <ThemeToggle />
          </div>

        {statusQuery.isLoading && <p>Loading…</p>}
        {statusQuery.isError && (
          <p className="error">
            {statusQuery.error?.response?.data?.error || 'Could not load status.'}
          </p>
        )}

        {data && (
          <>
            <div className="applicant-status__job">
              <span className="muted">Position Profile</span>
              <h2>{data.job_title}</h2>
              <p className="applicant-status__name">{data.applicant_name}</p>
            </div>

            <div className="applicant-status__row">
              <span className="muted">Current Status</span>
              <StatusBadge status={data.status} />
            </div>

            {data.status === 'withdrawn' ? (
              <div className="applicant-status__final-state withdrawn">
                <div className="status-icon">○</div>
                <h3>Application Withdrawn</h3>
                <p>Your application for this role has been successfully removed from the pipeline. If you wish to re-apply in the future, you will need to submit a new application.</p>
              </div>
            ) : data.status === 'hired' ? (
              <div className="applicant-status__final-state hired">
                <div className="status-icon">◈</div>
                <h3>Congratulations</h3>
                <p>You have been formally offered this position. Please check your email for the next steps and contract details.</p>
              </div>
            ) : data.status === 'rejected' ? (
              <div className="applicant-status__final-state rejected">
                <div className="status-icon">✕</div>
                <h3>Review Complete</h3>
                <p>Thank you for your time. The hiring team has decided to move forward with other candidates at this stage.</p>
              </div>
            ) : (
              <>
                {data.status === 'waitlisted' && data.waitlist_position != null && (
                  <div className="applicant-status__banner waitlist">
                    <strong>Pipeline Queue Position</strong>
                    <span className="queue-pos">#{data.waitlist_position}</span>
                    <p className="small muted">You will be automatically promoted to the active review stage as soon as a slot becomes available.</p>
                  </div>
                )}

                {ackPending && data.ack_deadline && (
                  <div className="applicant-status__banner ack">
                    <strong>Action Required: Acknowledge Promotion</strong>
                    <span className="applicant-status__countdown">
                      {remainingMs != null && remainingMs > 0
                        ? formatRemaining(remainingMs)
                        : 'Window ended — status will update shortly.'}
                    </span>
                    <p className="small muted">
                      Finalize your entry into the active pipeline before the deadline.
                    </p>
                  </div>
                )}

                {(ackPending || canWithdraw(data.status)) && (
                  <div className="applicant-status__forms">
                    <label className="field">
                      <span>Verification Email</span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </label>
                    {formError && <p className="error">{formError}</p>}
                    <div className="applicant-status__actions">
                      {ackPending && (
                        <button
                          type="button"
                          className="btn btn--primary"
                          disabled={ackMutation.isPending || withdrawMutation.isPending}
                          onClick={() => ackMutation.mutate()}
                        >
                          {ackMutation.isPending ? 'Processing…' : 'Acknowledge Promotion'}
                        </button>
                      )}
                      {canWithdraw(data.status) && (
                        <button
                          type="button"
                          className="btn btn--danger"
                          disabled={ackMutation.isPending || withdrawMutation.isPending}
                          onClick={() => {
                            if (!window.confirm('Are you sure you want to withdraw your application? This action cannot be undone.')) return;
                            withdrawMutation.mutate();
                          }}
                        >
                          {withdrawMutation.isPending ? 'Processing…' : 'Withdraw Application'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {!['withdrawn', 'hired', 'rejected'].includes(data.status) && (
              <div className="applicant-status__refresh">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => statusQuery.refetch()}
                  disabled={statusQuery.isFetching}
                >
                  {statusQuery.isFetching ? 'Synchronizing…' : 'Refresh Status'}
                </button>
              </div>
            )}
          </>
        )}

        <p className="small muted applicant-status__footer">
          <Link to="/login">Company sign in</Link>
        </p>
      </div>
    </div>
  );
}
