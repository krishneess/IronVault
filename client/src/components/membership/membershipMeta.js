/** Membership display constants and formatters (kept apart from components for fast refresh). */
export const STATUS_META = {
  created: { label: 'Created', variant: 'muted', hint: 'Plan selected – submit the application to continue.' },
  payment_pending: { label: 'Payment pending', variant: 'warning', hint: 'Pay at the front desk; an administrator will verify it.' },
  active: { label: 'Active', variant: 'success', hint: 'Full access to training features.' },
  suspended: { label: 'Suspended', variant: 'info', hint: 'Membership is on hold.' },
  expired: { label: 'Expired', variant: 'danger', hint: 'Validity period has ended.' },
  cancelled: { label: 'Cancelled', variant: 'danger', hint: 'Membership is closed.' },
  none: { label: 'No membership', variant: 'muted', hint: 'Choose a membership plan to get started.' },
};

export const STATUS_ORDER = ['created', 'payment_pending', 'active', 'suspended', 'expired', 'cancelled'];

export const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function durationLabel(days) {
  if (days % 365 === 0) return `${days / 365} year${days === 365 ? '' : 's'}`;
  if (days % 30 === 0) return `${days / 30} month${days === 30 ? '' : 's'}`;
  return `${days} days`;
}
