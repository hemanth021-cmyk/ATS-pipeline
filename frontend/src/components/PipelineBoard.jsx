import { ApplicantCard } from './ApplicantCard';
import { Title, Label } from './UI';

const MAIN = [
  { key: 'active', title: 'Active', icon: 'verified_user', colorClass: 'bg-tertiary-container' },
  { key: 'ack_pending', title: 'Awaiting Confirmation', icon: 'schedule', colorClass: 'bg-secondary-container' },
  { key: 'waitlisted', title: 'Waitlist', icon: 'queue', colorClass: 'bg-surface-container-highest' },
];

function inMainColumns(status) {
  return status === 'active' || status === 'ack_pending' || status === 'waitlisted';
}

export function PipelineBoard({ applications, onHire, onReject, busyId }) {
  const byStatus = (key) => applications.filter((a) => a.status === key);
  const other = applications.filter((a) => !inMainColumns(a.status));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {MAIN.map((col) => (
        <section key={col.key} className="bg-surface-container-low rounded-2xl p-6 flex flex-col min-h-96 shadow-md border border-outline-variant/10">
          {/* Column Header - Editorial Style */}
          <div className="mb-6 pb-5 border-b border-outline-variant/20">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-on-surface-variant">{col.icon}</span>
                <Title size="sm" className="text-on-surface">{col.title}</Title>
              </div>
            </div>
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-label-sm font-bold ${
              col.key === 'active' 
                ? 'bg-tertiary-container text-on-tertiary-container'
                : col.key === 'ack_pending'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-outline-variant/20 text-on-surface-variant'
            }`}>
              {byStatus(col.key).length}
            </span>
          </div>

          {/* Cards Container - With breathing room */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {byStatus(col.key).length === 0 && (
              <div className="flex items-center justify-center h-48">
                <Label className="text-on-surface-variant/50 italic">No applicants</Label>
              </div>
            )}
            {byStatus(col.key).map((app) => (
              <ApplicantCard
                key={app.id}
                application={app}
                onHire={onHire}
                onReject={onReject}
                busyId={busyId}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Terminal States Column - Outcomes */}
      <section className="bg-surface-container-low rounded-2xl p-6 flex flex-col min-h-96 shadow-md border border-outline-variant/10">
        <div className="mb-6 pb-5 border-b border-outline-variant/20">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-on-surface-variant">check_circle</span>
              <Title size="sm" className="text-on-surface">Outcomes</Title>
            </div>
          </div>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-label-sm font-bold bg-outline-variant/20 text-on-surface-variant">
            {other.length}
          </span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {other.length === 0 && (
            <div className="flex items-center justify-center h-48">
              <Label className="text-on-surface-variant/50 italic">None yet</Label>
            </div>
          )}
          {other.map((app) => (
            <ApplicantCard
              key={app.id}
              application={app}
              onHire={onHire}
              onReject={onReject}
              busyId={busyId}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
