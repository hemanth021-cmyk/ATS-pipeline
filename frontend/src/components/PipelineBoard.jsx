import { ApplicantCard } from './ApplicantCard';
import { Title, Label, TonalContainer } from './UI';

const MAIN = [
  { 
    key: 'active', 
    title: 'Active Pipeline', 
    description: 'Candidates currently being reviewed.',
    icon: 'verified_user', 
    color: 'var(--tertiary)' 
  },
  { 
    key: 'ack_pending', 
    title: 'Awaiting Action', 
    description: 'Pending promote confirmation.',
    icon: 'schedule', 
    color: 'var(--secondary)' 
  },
  { 
    key: 'waitlisted', 
    title: 'Queue / Waitlist', 
    description: 'Next in line for promotion.',
    icon: 'queue', 
    color: 'var(--primary)' 
  },
];

function inMainColumns(status) {
  return status === 'active' || status === 'ack_pending' || status === 'waitlisted';
}

export function PipelineBoard({ applications, onHire, onReject, busyId }) {
  const byStatus = (key) => applications.filter((a) => a.status === key);
  const other = applications.filter((a) => !inMainColumns(a.status));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {MAIN.map((col) => (
        <div key={col.key} className="flex flex-col min-h-[600px] animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Column Header - Editorial Gallery Style */}
          <div className="mb-6 px-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container shadow-sm">
                  <span className="material-symbols-outlined text-[20px]" style={{ color: col.color }}>{col.icon}</span>
                </div>
                <Title size="sm" className="font-bold tracking-tight">{col.title}</Title>
              </div>
              <span className="text-[12px] font-black opacity-20 tracking-tighter">
                {byStatus(col.key).length.toString().padStart(2, '0')}
              </span>
            </div>
            <p className="text-[11px] opacity-40 font-medium uppercase tracking-widest pl-[52px]">
              {col.description}
            </p>
          </div>

          {/* Cards Column - Tonal background shift without border */}
          <TonalContainer className="flex-1 flex flex-col gap-4 p-4 !bg-surface-container-low/40">
            {byStatus(col.key).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 grayscale">
                <span className="material-symbols-outlined text-[48px] mb-2">inbox</span>
                <Label size="sm" className="font-bold uppercase tracking-widest">Empty</Label>
              </div>
            ) : (
              byStatus(col.key).map((app) => (
                <ApplicantCard
                  key={app.id}
                  application={app}
                  onHire={onHire}
                  onReject={onReject}
                  busyId={busyId}
                />
              ))
            )}
          </TonalContainer>
        </div>
      ))}

      {/* Terminal States Column - Outcomes */}
      <div className="flex flex-col min-h-[600px] animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="mb-6 px-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">auto_awesome</span>
              </div>
              <Title size="sm" className="font-bold tracking-tight">Outcomes</Title>
            </div>
            <span className="text-[12px] font-black opacity-20 tracking-tighter">
              {other.length.toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-[11px] opacity-40 font-medium uppercase tracking-widest pl-[52px]">
            Final decisions & history
          </p>
        </div>

        <TonalContainer className="flex-1 flex flex-col gap-4 p-4 !bg-surface-container-low/40">
          {other.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 grayscale">
              <span className="material-symbols-outlined text-[48px] mb-2">history_edu</span>
              <Label size="sm" className="font-bold uppercase tracking-widest">No History</Label>
            </div>
          ) : (
            other.map((app) => (
              <ApplicantCard
                key={app.id}
                application={app}
                onHire={onHire}
                onReject={onReject}
                busyId={busyId}
              />
            ))
          )}
        </TonalContainer>
      </div>
    </div>
  );
}
