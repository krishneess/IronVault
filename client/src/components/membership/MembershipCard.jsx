import { CalendarClock, CreditCard, PauseCircle } from 'lucide-react';
import { Card, InfoRow } from '../common/Display';
import { MembershipStatusBadge, ValidityBar } from './membershipUi';
import { STATUS_META, durationLabel, formatMoney } from './membershipMeta';
import { formatDate, titleCase } from '../../utils/format';

/** Current membership summary with the actions the viewer may take. */
export default function MembershipCard({ membership, onAction, title = 'Current membership', compact = false }) {
  if (!membership) return null;
  const v = membership.validity || {};
  return (
    <Card
      title={title}
      actions={<MembershipStatusBadge status={membership.status} />}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <div className="eyebrow mb-1">Plan</div>
          <div className="font-display h3 mb-0">{membership.planType}</div>
        </div>
        <div className="text-end">
          <div className="h4 mb-0 text-gold">{formatMoney(membership.fee)}</div>
          <div className="text-muted-iv" style={{ fontSize: '.8rem' }}>{durationLabel(membership.durationInDays)}</div>
        </div>
      </div>
      <p className="text-muted-iv" style={{ fontSize: '.88rem' }}>{STATUS_META[membership.status]?.hint}</p>

      {['active', 'suspended'].includes(membership.status) && <div className="mb-3"><ValidityBar membership={membership} /></div>}

      {!compact && (
        <>
          {membership.status === 'suspended' && (
            <InfoRow label={<><PauseCircle size={14} className="me-2" />Hold ends (auto-expiry)</>} value={formatDate(v.holdEndsAt)} />
          )}
          {membership.maxHoldDays > 0 && <InfoRow label="Hold allowance remaining" value={`${v.holdDaysRemaining ?? 0} of ${membership.maxHoldDays} days`} />}
          {membership.payment?.verifiedAt && (
            <InfoRow
              label={<><CreditCard size={14} className="me-2" />Payment</>}
              value={`${titleCase(membership.payment.method || '')}${membership.payment.reference ? ` · ${membership.payment.reference}` : ''} · ${formatDate(membership.payment.verifiedAt)}`}
            />
          )}
          {membership.closedReason && <InfoRow label="Reason" value={membership.closedReason} />}
          <InfoRow label={<><CalendarClock size={14} className="me-2" />Created</>} value={formatDate(membership.createdAt)} />
        </>
      )}

      {onAction && membership.actions?.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-3">
          {membership.actions.map((a) => {
            const danger = ['terminate', 'revoke', 'cancel_application', 'abandon_payment', 'decline_renewal'].includes(a.action);
            return (
              <button key={a.action} type="button" className={`btn btn-sm ${danger ? 'btn-danger-soft' : 'btn-gold'}`} onClick={() => onAction(a)}>
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
