import { useState } from 'react';
import { Crown, History } from 'lucide-react';
import { Card, PageHeader } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import MembershipCard from '../../components/membership/MembershipCard';
import TierCards from '../../components/membership/TierCards';
import TransitionModal from '../../components/membership/TransitionModal';
import { MembershipStatusBadge, StatusTimeline } from '../../components/membership/membershipUi';
import { STATUS_ORDER, formatMoney } from '../../components/membership/membershipMeta';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { membershipService, tierService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';

const STEPS = ['created', 'payment_pending', 'active'];

/** Lifecycle stepper for the happy path Created → Payment Pending → Active. */
function LifecycleSteps({ status }) {
  const index = STEPS.indexOf(status);
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
      {STEPS.map((s, i) => (
        <div key={s} className="d-flex align-items-center gap-2">
          <span className={`lifecycle-state ${i <= index ? 'active' : ''}`} style={{ padding: '.45rem .85rem', fontSize: '.8rem', borderRadius: 10, border: '1px solid var(--iv-border)' }}>
            {i + 1}. {s === 'payment_pending' ? 'Payment pending' : s[0].toUpperCase() + s.slice(1)}
          </span>
          {i < STEPS.length - 1 && <span className="text-gold">›</span>}
        </div>
      ))}
    </div>
  );
}

export default function MemberMembership() {
  const toast = useToast();
  const confirm = useConfirm();
  const overview = useApiData(() => membershipService.mine(), []);
  const tiers = useApiData(() => tierService.listPublic(), []);
  const [selecting, setSelecting] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  if (overview.loading) return <PageLoader label="Loading your membership…" />;
  if (overview.error) return <Card><ErrorState message={overview.error} onRetry={overview.reload} /></Card>;

  const { current, canStartNew, history } = overview.data;

  const onSelect = async (tier) => {
    const ok = await confirm({
      title: `Choose ${tier.name}?`,
      message: `${formatMoney(tier.price)} for ${tier.durationInDays} days. You'll submit the application next and pay at the front desk.`,
      confirmText: 'Select plan',
      variant: 'primary',
    });
    if (!ok) return;
    setSelecting(tier._id);
    try {
      await membershipService.selectPlan(tier._id);
      toast.success('Plan selected', 'Submit your application to continue.');
      overview.reload();
    } catch (err) {
      toast.error('Could not select plan', err.message);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Member" title="My membership" description="Your plan, its status and validity." />

      {current && !canStartNew && <LifecycleSteps status={current.status} />}

      {current && (
        <div className="mb-4">
          <MembershipCard membership={current} onAction={setPendingAction} title={canStartNew ? 'Last membership' : 'Current membership'} />
        </div>
      )}

      {canStartNew && (
        <div className="mb-4">
          <div className="eyebrow mb-1">{current ? 'Renew your membership' : 'Get started'}</div>
          <h2 className="h4 mb-3">Choose a membership plan</h2>
          {tiers.loading ? (
            <div className="skeleton" style={{ height: 260 }} />
          ) : tiers.error ? (
            <Card><ErrorState message={tiers.error} onRetry={tiers.reload} /></Card>
          ) : !tiers.data.length ? (
            <Card><EmptyState icon={Crown} title="No plans available" message="The gym has not published membership plans yet. Please check back soon." /></Card>
          ) : (
            <TierCards tiers={tiers.data} onSelect={onSelect} selectingId={selecting} />
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="row g-4">
          <div className="col-lg-7">
            <Card title="Membership history" noPadding>
              <div className="table-responsive">
                <table className="table iv-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Fee</th>
                      <th>Valid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || new Date(b.createdAt) - new Date(a.createdAt)).map((m) => (
                      <tr key={m._id}>
                        <td className="fw-semibold">{m.planType}</td>
                        <td><MembershipStatusBadge status={m.status} /></td>
                        <td>{formatMoney(m.fee)}</td>
                        <td className="text-muted-iv text-nowrap">{m.startDate ? `${formatDate(m.startDate)} – ${formatDate(m.endDate)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          {current && (
            <div className="col-lg-5">
              <Card title={<><History size={17} className="text-gold me-2" />Status timeline</>} subtitle={current.planType}>
                <StatusTimeline history={current.statusHistory} />
              </Card>
            </div>
          )}
        </div>
      )}

      {pendingAction && (
        <TransitionModal key={pendingAction.action} membership={current} action={pendingAction} onClose={() => setPendingAction(null)} onDone={overview.reload} />
      )}
    </>
  );
}
