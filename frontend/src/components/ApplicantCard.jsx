import { formatRelative } from '../utils/time';
import { StatusBadge } from './StatusBadge';
import { Button, Body, Label, Card } from './UI';

export function ApplicantCard({ application, onHire, onReject, busyId }) {
  const { id, applicant_name, applicant_email, status, waitlist_position, updated_at, ack_deadline } =
    application;
  const busy = busyId === id;
  const canHire = status === 'active' || status === 'ack_pending';
  const canReject = !['hired', 'rejected', 'withdrawn'].includes(status);

  return (
    <Card className="group animate-fade-in">
      {/* Header: Name and Status */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 truncate">
          <h4 className="text-title-sm font-bold text-on-surface group-hover:text-secondary transition-colors truncate">
            {applicant_name}
          </h4>
          <p className="text-body-sm opacity-60 truncate">{applicant_email}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Meta info */}
      <div className="space-y-2 mb-6">
        {status === 'waitlisted' && waitlist_position != null && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-outline animate-pulse" />
            <Label size="sm" className="text-outline font-bold">
              Queue position #{waitlist_position}
            </Label>
          </div>
        )}
        {status === 'ack_pending' && ack_deadline && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-error-container/10 border border-error/10">
            <span className="text-sm">⏰</span>
            <Label size="sm" className="text-error font-bold">
              Deadline: {new Date(ack_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Label>
          </div>
        )}
        <div className="flex items-center gap-2 opacity-40">
          <span className="text-[10px]">●</span>
          <Body size="sm" className="text-[11px] font-medium tracking-tight">
            {formatRelative(updated_at)}
          </Body>
        </div>
      </div>

      {/* Actions */}
      {(canHire || canReject) && (
        <div className="flex gap-3 pt-4 border-t border-surface-container-low transition-colors group-hover:border-surface-container">
          {canHire && (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => onHire(id)}
              className="flex-1 py-3 text-[11px] uppercase tracking-widest"
            >
              {busy ? '…' : 'Promote to Hire'}
            </Button>
          )}
          {canReject && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onReject(id)}
              className="flex-1 py-3 text-[11px] uppercase tracking-widest"
            >
              Reject
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
