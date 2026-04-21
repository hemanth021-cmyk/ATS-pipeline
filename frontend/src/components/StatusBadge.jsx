import { Chip } from './UI';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', status: 'pending' },
  waitlisted: { label: 'Waitlisted', status: 'waitlisted' },
  active: { label: 'Active', status: 'active' },
  ack_pending: { label: 'Action Required', status: 'pending' },
  hired: { label: 'Hired', status: 'hired' },
  rejected: { label: 'Rejected', status: 'rejected' },
  withdrawn: { label: 'Withdrawn', status: 'withdrawn' },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, status: 'default' };
  return <Chip status={config.status} label={config.label} />;
}
