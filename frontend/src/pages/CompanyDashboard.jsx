import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AuditPanel } from '../components/AuditPanel';
import { CapacityBar } from '../components/CapacityBar';
import { PipelineBoard } from '../components/PipelineBoard';
import { Button, TextField, Container, Title, Body, Label, TonalContainer } from '../components/UI';

const POLL_MS = 30_000;

export function CompanyDashboard() {
  const { logout, user } = useAuth();
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
    e.target.reset();
  }

  return (
    <div className="bg-background min-h-screen text-on-surface">
      {/* Editorial Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-surface-container-highest/20">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">all_inclusive</span>
              </div>
              <Title size="sm" className="font-black tracking-tighter">FLUX</Title>
            </div>
            
            <div className="h-6 w-[1px] bg-surface-container opacity-20" />
            
            <div className="flex items-center gap-6">
              <select
                value={validJobId ? String(validJobId) : ''}
                onChange={handleJobChange}
                disabled={jobs.length === 0}
                className="bg-transparent border-none text-[13px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:text-primary transition-colors pr-8 appearance-none"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right center',
                  backgroundSize: '1em'
                }}
              >
                {jobs.length === 0 && <option value="">No Active Instances</option>}
                {jobs.map((j) => (
                  <option key={j.id} value={j.id} className="bg-surface text-on-surface">
                    ({j.status.toUpperCase()}) {j.title}
                  </option>
                ))}
              </select>
              {job && (
                <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full">
                  <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'open' ? 'bg-tertiary shadow-[0_0_8px_rgba(0,188,212,0.4)]' : 'bg-on-surface-variant/30'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{job.status}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Authentificated as</p>
              <p className="text-[12px] font-bold tracking-tight">{user?.name || 'Curator'}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-highest transition-colors group"
            >
              <span className="material-symbols-outlined text-[18px] opacity-40 group-hover:opacity-100 transition-opacity">logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-12">
        <div className="grid grid-cols-12 gap-12">
          
          {/* Main Pipeline Area */}
          <div className="col-span-12 xl:col-span-9 space-y-12">
            
            {/* Page Header */}
            <header className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Label className="uppercase tracking-[0.3em] font-black text-[10px] opacity-40 mb-3 block">Perspective / Control Room</Label>
              <h2 className="text-[4rem] font-black tracking-tighter leading-none mb-6">
                {job?.title || 'Pipeline Overview'}
              </h2>
              {job?.description && (
                <p className="text-lg font-medium opacity-40 max-w-2xl leading-relaxed">
                  {job.description}
                </p>
              )}
            </header>

            {job && counts && (
              <div className="space-y-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CapacityBar activeCount={activeCount} capacity={capacity} />
                
                <section className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <Title size="sm" className="font-bold tracking-tight">Curation Grid</Title>
                      <p className="text-[11px] opacity-40 font-medium uppercase tracking-widest mt-1">Real-time candidate orchestration</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,87,189,0.4)] animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Live Sync Engaged</span>
                    </div>
                  </div>
                  
                  <PipelineBoard
                    applications={applicationsQuery.data || []}
                    onHire={onHire}
                    onReject={onReject}
                    busyId={busyId}
                  />
                </section>
              </div>
            )}

            {!validJobId && !jobsQuery.isLoading && (
              <div className="py-40 text-center space-y-6">
                <span className="material-symbols-outlined text-[80px] opacity-10">layers_clear</span>
                <Title className="font-black tracking-tight opacity-20">No Active Pipeline Instances</Title>
                <p className="text-[11px] font-black uppercase tracking-widest opacity-30">Create your first position to begin curation</p>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <aside className="col-span-12 xl:col-span-3 space-y-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            
            {/* Create Job Card */}
            <TonalContainer className="p-8 rounded-[2.5rem] bg-surface-container-low shadow-xl">
              <Title size="sm" className="font-bold tracking-tight mb-2">Initiate Position</Title>
              <p className="text-[11px] opacity-40 font-medium uppercase tracking-widest mb-8">Role Curation Parameters</p>
              
              <form onSubmit={handleCreateJob} className="space-y-6">
                <TextField
                  name="title"
                  label="Role Signature"
                  placeholder="e.g. Design Partner"
                  required
                />
                <TextField
                  name="active_capacity"
                  label="Focus Threshold"
                  type="number"
                  min="1"
                  defaultValue="3"
                  required
                />
                <TextField
                  name="description"
                  label="Context / Ethos"
                  placeholder="Optional team nuances..."
                />
                {createError && (
                  <div className="p-4 bg-error-container/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-error uppercase tracking-widest text-center">{createError}</p>
                  </div>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-full py-4 text-[12px] font-black uppercase tracking-widest"
                  disabled={createJobMutation.isPending}
                  loading={createJobMutation.isPending}
                >
                  Create Instance
                </Button>
              </form>
            </TonalContainer>

            {/* Audit History */}
            {validJobId && (
              <div className="space-y-6">
                <div className="px-2">
                  <div className="flex items-center justify-between mb-1">
                    <Title size="sm" className="font-bold tracking-tight">Lineage</Title>
                    <span className="text-[10px] font-black opacity-20 tracking-widest">REAL-TIME</span>
                  </div>
                  <p className="text-[11px] opacity-40 font-medium uppercase tracking-widest">Protocol Audit Trail</p>
                </div>
                
                <AuditPanel
                  entries={auditQuery.data}
                  loading={auditQuery.isLoading}
                  error={auditQuery.isError ? 'Stream Disconnected' : null}
                />
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
