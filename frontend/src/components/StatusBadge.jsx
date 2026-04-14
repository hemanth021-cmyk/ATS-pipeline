import { Chip } from './UI';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', type: 'default' },
  waitlisted: { label: 'Waitlisted', type: 'waitlisted' },
  active: { label: 'Active', type: 'active' },
  ack_pending: { label: 'Ack Pending', type: 'pending' },
  hired: { label: 'Hired', type: 'active' },
  rejected: { label: 'Rejected', type: 'default' },
  withdrawn: { label: 'Withdrawn', type: 'default' },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, type: 'default' };
  return <Chip status={config.type} label={config.label} />;
}
