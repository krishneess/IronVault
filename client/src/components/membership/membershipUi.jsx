import { Link } from 'react-router-dom';
import { Crown, LockKeyhole } from 'lucide-react';
import { Badge, Card } from '../common/Display';
import { formatDate } from '../../utils/format';
import { STATUS_META } from './membershipMeta';

export function MembershipStatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.none;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

/** Days-remaining bar for active / suspended memberships. */
export function ValidityBar({ membership }) {
  if (!membership?.startDate || !membership?.endDate) return null;
  const total = new Date(membership.endDate) - new Date(membership.startDate);
  const left = Math.max(0, new Date(membership.endDate) - Date.now());
  const pct = total > 0 ? Math.round((left / total) * 100) : 0;
  return (
    <div>
      <div className="d-flex justify-content-between mb-1" style={{ fontSize: '.82rem' }}>
        <span className="text-muted-iv">{formatDate(membership.startDate)} → {formatDate(membership.endDate)}</span>
        <span className="fw-semibold">{membership.validity?.daysRemaining ?? 0} days left</span>
      </div>
      <div style={{ height: 8, borderRadius: 8, background: 'var(--iv-surface-3)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--iv-gold-gradient)' }} />
      </div>
    </div>
  );
}

/** Shown in place of a training page when the member's membership is not Active. */
export function MembershipRequired({ message }) {
  return (
    <Card>
      <div className="empty-state">
        <div className="empty-state-icon"><LockKeyhole size={26} /></div>
        <h3 className="h5 text-light mb-1">Active membership required</h3>
        <p className="mx-auto mb-3" style={{ maxWidth: 440, fontSize: '.9rem' }}>
          {message || 'This feature is available to members with an active membership.'}
        </p>
        <Link to="/member/membership" className="btn btn-gold">
          <Crown size={17} /> View membership
        </Link>
      </div>
    </Card>
  );
}

/** Ordered status timeline from statusHistory. */
export function StatusTimeline({ history = [] }) {
  return (
    <div>
      {[...history].reverse().map((h, i) => (
        <div key={i} className="activity-item">
          <span className="activity-dot" style={{ width: 28, height: 28 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--iv-gold)' }} />
          </span>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <MembershipStatusBadge status={h.to} />
              <span className="text-muted-iv" style={{ fontSize: '.8rem' }}>{h.action.replace(/_/g, ' ')}</span>
            </div>
            <div className="text-muted-iv mt-1" style={{ fontSize: '.78rem' }}>
              {new Date(h.at).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {h.byRole === 'system' ? 'System' : h.by?.name || h.byRole}
              {h.note ? ` · “${h.note}”` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
