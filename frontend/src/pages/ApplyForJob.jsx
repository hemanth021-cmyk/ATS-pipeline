import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Title, Label, Body, Button, TextField, TonalContainer } from '../components/UI';

export function ApplyForJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const jobQuery = useQuery({
    queryKey: ['publicJob', jobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${jobId}/public`);
      return data;
    },
    enabled: !!jobId,
    retry: false,
  });

  const applyMutation = useMutation({
    mutationFn: (payload) => api.post(`/jobs/${jobId}/apply`, payload),
    onSuccess: (res) => {
      const appId = res.data.application.id;
      navigate(`/status?id=${appId}`);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    applyMutation.mutate({
      applicant_name: name.trim(),
      applicant_email: email.trim().toLowerCase(),
    });
  };

  if (jobQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface space-y-4 opacity-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <Label className="uppercase tracking-[0.2em] font-black text-[10px]">Retrieving Instance...</Label>
      </div>
    );
  }

  if (jobQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-error/10 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-error text-[32px]">warning</span>
          </div>
          <Title className="text-display-sm font-black tracking-tighter">Position Closed</Title>
          <p className="text-on-surface-variant font-medium opacity-60 leading-relaxed">
            The position you are looking for has been archived or is no longer accepting new intakes.
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

  const job = jobQuery.data;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 flex flex-col lg:flex-row">
      {/* Left: Job Branding / Context */}
      <div className="lg:w-1/2 p-8 lg:p-20 flex flex-col justify-between bg-surface relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">all_inclusive</span>
            </div>
            <Title size="sm" className="font-black tracking-tighter">FLUX TALENT</Title>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-[10px] font-black uppercase tracking-widest rounded-full">Open Position</span>
              <div className="h-0.5 w-8 bg-on-surface/10" />
              <span className="text-[10px] font-black opacity-20 uppercase tracking-[0.2em]">Instance #{jobId}</span>
            </div>
            <h1 className="text-[4rem] font-black tracking-tighter leading-none text-on-surface">
              {job.title}
            </h1>
            <p className="text-xl font-medium text-on-surface-variant opacity-60 leading-relaxed max-w-lg">
              {job.description || "Join our high-fidelity pipeline. We curate talent through a dedicated focus system."}
            </p>
          </div>
        </div>

        <div className="z-10 mt-12 pt-12 border-t border-on-surface/5 flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
          <div className="flex flex-col gap-2">
            <span>Automated</span>
            <span>Curation</span>
          </div>
          <div className="flex flex-col gap-2">
            <span>Verified</span>
            <span>Linear Trail</span>
          </div>
          <div className="flex flex-col gap-2">
            <span>Concierge</span>
            <span>Experience</span>
          </div>
        </div>

        {/* Background Flair */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Right: Application Form */}
      <div className="lg:w-1/2 p-8 lg:p-20 flex flex-col items-center justify-center bg-surface-container-lowest">
        <div className="w-full max-w-sm space-y-10">
          <div className="text-center lg:text-left">
            <h2 className="text-display-sm font-black tracking-tighter text-on-surface mb-2">Initiate Application</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Identity Verification Required</p>
          </div>

          <TonalContainer className="p-10 rounded-[3rem] bg-surface-container-low shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              <TextField
                label="Full Name"
                placeholder="Candidate Signature"
                icon="person"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextField
                label="Corporate Email"
                type="email"
                placeholder="you@corporate.com"
                icon="mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && (
                <div className="p-4 bg-error-container/10 rounded-2xl animate-fade-in">
                  <p className="text-[11px] font-bold text-error uppercase tracking-widest text-center">{error}</p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="primary"
                  type="submit"
                  className="w-full py-4 text-[12px] font-black uppercase tracking-widest"
                  disabled={applyMutation.isPending}
                  loading={applyMutation.isPending}
                >
                  Submit Application
                </Button>
              </div>
            </form>
          </TonalContainer>

          <footer className="text-center lg:text-left opacity-30 space-y-4">
            <p className="text-[10px] font-medium leading-relaxed">
              By initiating, you agree to our automated selection protocol. Applications beyond active capacity are placed in a high-fidelity waitlist.
            </p>
            <div className="pt-4">
              <Link to="/login" className="text-[9px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors">
                Company Authentication →
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
