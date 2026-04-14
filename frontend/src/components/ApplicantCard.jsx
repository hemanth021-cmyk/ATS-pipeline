import { formatRelative } from '../utils/time';
import { StatusBadge } from './StatusBadge';
import { Button, Body, Label } from './UI';

export function ApplicantCard({ application, onHire, onReject, busyId }) {
  const { id, applicant_name, applicant_email, status, waitlist_position, updated_at, ack_deadline } =
    application;
  const busy = busyId === id;
  const canHire = status === 'active' || status === 'ack_pending';
  const canReject = !['hired', 'rejected', 'withdrawn'].includes(status);

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/5 hover:border-outline-variant/15 group">
      {/* Header: Name and Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="title-sm text-on-surface flex-1 truncate group-hover:text-primary transition-colors">{applicant_name}</h4>
        <StatusBadge status={status} />
      </div>

      {/* Email */}
      <p className="body-sm text-on-surface-variant/80 mb-2.5 truncate">{applicant_email}</p>

      {/* Meta info */}
      <div className="space-y-2 mb-4 text-xs">
        {status === 'waitlisted' && waitlist_position != null && (
          <Label className="text-tertiary block font-semibold">
            Queue position #{waitlist_position}
          </Label>
        )}
        {status === 'ack_pending' && ack_deadline && (
          <Label className="text-error block font-medium">
            ⏰ {new Date(ack_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Label>
        )}
        <Body size="sm" className="text-on-surface-variant/60 text-xs">
          {formatRelative(updated_at)}
        </Body>
      </div>

      {/* Actions */}
      {(canHire || canReject) && (
        <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
          {canHire && (
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => onHire(id)}
              className="flex-1 text-xs py-2"
            >
              {busy ? '…' : 'Hire'}
            </Button>
          )}
          {canReject && (
            <Button
              variant="tertiary"
              size="sm"
              disabled={busy}
              onClick={() => onReject(id)}
              className="flex-1 text-xs py-2"
            >
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
