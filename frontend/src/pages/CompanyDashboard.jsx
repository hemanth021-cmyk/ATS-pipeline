import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AuditPanel } from '../components/AuditPanel';
import { CapacityBar } from '../components/CapacityBar';
import { PipelineBoard } from '../components/PipelineBoard';
import ThemeToggle from '../components/ThemeToggle';
import { Button, TextField, Container, Title, Body, Label } from '../components/UI';

const POLL_MS = 30_000;

export function CompanyDashboard() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobIdParam = searchParams.get('job');
  const jobId = jobIdParam ? Number.parseInt(jobIdParam, 10) : null;
  const validJobId = Number.isFinite(jobId) && jobId > 0 ? jobId : null;

  const [busyId, setBusyId] = useState(null);
  const [createError, setCreateError] = useState('');

  const jobsQuery = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data } = await api.get('/jobs');
      return data.jobs;
    },
    refetchInterval: POLL_MS,
  });

  const jobs = jobsQuery.data || [];

  useEffect(() => {
    if (jobs.length === 0) return;
    if (validJobId && jobs.some((j) => j.id === validJobId)) return;
    const first = jobs[0].id;
    setSearchParams({ job: String(first) }, { replace: true });
  }, [jobs, validJobId, setSearchParams]);

  const jobDetailQuery = useQuery({
    queryKey: ['job', validJobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${validJobId}`);
      return data;
    },
    enabled: Boolean(validJobId),
    refetchInterval: POLL_MS,
  });

  const applicationsQuery = useQuery({
    queryKey: ['applications', validJobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${validJobId}/applications`, {
        params: { limit: 500 },
      });
      return data.applications;
    },
    enabled: Boolean(validJobId),
    refetchInterval: POLL_MS,
  });

  const auditQuery = useQuery({
    queryKey: ['audit', validJobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${validJobId}/audit`, { params: { limit: 500 } });
      return data.entries;
    },
    enabled: Boolean(validJobId),
    refetchInterval: POLL_MS,
  });

  const invalidateJobData = useCallback(() => {
    if (!validJobId) return;
    queryClient.invalidateQueries({ queryKey: ['job', validJobId] });
    queryClient.invalidateQueries({ queryKey: ['applications', validJobId] });
    queryClient.invalidateQueries({ queryKey: ['audit', validJobId] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  }, [queryClient, validJobId]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/applications/${id}/status`, { status }),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => {
      setBusyId(null);
      invalidateJobData();
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (body) => api.post('/jobs', body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSearchParams({ job: String(res.data.id) });
      setCreateError('');
    },
    onError: (err) => {
      setCreateError(err.response?.data?.error || err.message || 'Failed to create job');
    },
  });

  const onHire = (id) => {
    if (!window.confirm('Mark this applicant as hired?')) return;
    statusMutation.mutate({ id, status: 'hired' });
  };

  const onReject = (id) => {
    if (!window.confirm('Reject this applicant?')) return;
    statusMutation.mutate({ id, status: 'rejected' });
  };

  const job = jobDetailQuery.data?.job;
  const counts = jobDetailQuery.data?.pipeline_counts;

  const activeCount = useMemo(() => counts?.active ?? 0, [counts]);
  const capacity = job?.active_capacity ?? 1;

  function handleJobChange(e) {
    const v = e.target.value;
    if (v) setSearchParams({ job: v });
  }

  function handleCreateJob(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = String(fd.get('title') || '').trim();
    const active_capacity = Number(fd.get('active_capacity'));
    const description = String(fd.get('description') || '').trim() || undefined;
    if (!title || !Number.isFinite(active_capacity) || active_capacity < 1) {
      setCreateError('Title and a positive capacity are required.');
      return;
    }
    createJobMutation.mutate({ title, active_capacity, description });
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header - Asymmetrical Premium Design */}
      <header className="bg-surface-container-low border-b border-outline-variant/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-end justify-between gap-6">
            {/* Left: Brand with Editorial Feel */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">pipeline</span>
                <h1 className="title-lg text-on-surface tracking-tight truncate">Executive Pipeline</h1>
              </div>
              <p className="body-sm text-on-surface-variant/70">Hiring Intelligence System</p>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <ThemeToggle />
              <Button variant="tertiary" size="sm" onClick={() => logout()} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-10">
        {/* Job Selection Section - Tonal Layering */}
        <section className="bg-surface-container-low rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <Title size="sm" className="text-on-surface">Active Positions</Title>
            <Label className="text-on-surface-variant/70 text-xs">Auto-syncs every {POLL_MS / 1000}s</Label>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={validJobId ? String(validJobId) : ''}
              onChange={handleJobChange}
              disabled={jobs.length === 0}
              className="flex-1 px-5 py-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all duration-200 outline-none hover:border-outline-variant/30"
            >
              {jobs.length === 0 && <option value="">No positions yet</option>}
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} (#{j.id}) — {j.status}
                </option>
              ))}
            </select>
            {job && (
              <span className={`px-4 py-2 rounded-full text-label-xs font-semibold whitespace-nowrap ${
                job.status === 'open'
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : 'bg-outline-variant/20 text-on-surface-variant'
              }`}>
                {job.status === 'open' ? '● Open' : '● Closed'}
              </span>
            )}
          </div>
          {jobsQuery.isError && (
            <div className="mt-4 p-4 bg-error-container/10 border border-error/20 rounded-xl">
              <Body size="sm" className="text-error">Could not load positions. Please try again.</Body>
            </div>
          )}
        </section>

        {/* Create New Position - Premium Card */}
        <section className="bg-surface-container-low rounded-2xl p-8">
          <div className="mb-6">
            <Title size="sm" className="text-on-surface mb-2">Open New Position</Title>
            <Body size="sm" className="text-on-surface-variant/75">
              Define hiring parameters and capacity constraints for your role.
            </Body>
          </div>
          <form onSubmit={handleCreateJob} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <TextField
                name="title"
                label="Position Title"
                placeholder="e.g. Senior Product Manager"
                required
              />
              <TextField
                name="active_capacity"
                label="Active Capacity"
                type="number"
                min="1"
                defaultValue="3"
                required
              />
              <TextField
                name="description"
                label="Team Context (Optional)"
                placeholder="Department, team details..."
              />
            </div>
            {createError && (
              <div className="p-4 bg-error-container/10 border border-error/20 rounded-xl">
                <Body size="sm" className="text-error">{createError}</Body>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                disabled={createJobMutation.isPending}
              >
                {createJobMutation.isPending ? 'Creating…' : 'Launch Position'}
              </Button>
            </div>
          </form>
        </section>

        {/* Job Details */}
        {validJobId && jobDetailQuery.isError && (
          <div className="p-6 bg-error-container/10 border border-error/20 rounded-xl mb-8">
            <Body className="text-error">Could not load position #{validJobId} details. Please refresh.</Body>
          </div>
        )}

        {job && counts && (
          <>
            <CapacityBar activeCount={activeCount} capacity={capacity} />
            
            <section className="space-y-4">
              <Title size="sm" className="text-on-surface">Candidate Pipeline</Title>
              <PipelineBoard
                applications={applicationsQuery.data || []}
                onHire={onHire}
                onReject={onReject}
                busyId={busyId}
              />
            </section>

            <AuditPanel
              entries={auditQuery.data}
              loading={auditQuery.isLoading}
              error={auditQuery.isError ? 'Failed to load audit trail' : null}
            />
          </>
        )}

        {validJobId && jobDetailQuery.isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-4 text-center">
              <div className="w-8 h-8 mx-auto border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Body className="text-on-surface-variant">Loading position details…</Body>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
