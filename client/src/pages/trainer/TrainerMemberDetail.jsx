import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Link2, LineChart as LineChartIcon, Salad, UserMinus } from 'lucide-react';
import { Avatar, Card, InfoRow, StatCard, StatusBadge } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import ProgressChartCard from '../../components/fitness/ProgressChartCard';
import RecordsTable from '../../components/fitness/RecordsTable';
import { LevelBadge } from '../../components/fitness/PlanContent';
import { AssignPlanForMemberModal } from '../../components/fitness/AssignModals';
import { PLAN_TYPES } from '../../components/fitness/planTypes';
import { formatChange, formatMetric } from '../../components/fitness/metrics';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { trainerService } from '../../services/fitnessService';
import useApiData from '../../hooks/useApiData';
import { formatDate, titleCase } from '../../utils/format';

/** Trainer view of one assigned member: profile, plans, progress monitoring. */
export default function TrainerMemberDetail() {
  const { memberId } = useParams();
  const confirm = useConfirm();
  const toast = useToast();
  const [assignOpen, setAssignOpen] = useState(false);
  const detail = useApiData(() => trainerService.member(memberId), [memberId]);
  const progress = useApiData(() => trainerService.memberProgress(memberId), [memberId]);

  if (detail.loading) return <PageLoader label="Loading member…" />;
  if (detail.error) {
    return (
      <>
        <Link to="/trainer/members" className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={16} /> My members</Link>
        <Card><ErrorState message={detail.error} onRetry={detail.reload} /></Card>
      </>
    );
  }

  const { member, assignedDate, workoutPlans, dietPlans, progress: summary } = detail.data;
  const latest = summary.latest;

  const onUnassign = async (type, plan) => {
    const cfg = PLAN_TYPES[type];
    const ok = await confirm({
      title: `Unassign “${plan.title}”?`,
      message: `${member.name} will no longer see this ${cfg.label.toLowerCase()}.`,
      confirmText: 'Unassign',
    });
    if (!ok) return;
    try {
      await cfg.service.unassign(plan._id, member._id);
      toast.success('Plan unassigned', plan.title);
      detail.reload();
    } catch (err) {
      toast.error('Could not unassign plan', err.message);
    }
  };

  const planRows = (type, plans) => {
    const cfg = PLAN_TYPES[type];
    if (!plans.length) return <EmptyState icon={cfg.icon} title={`No ${cfg.label.toLowerCase()} assigned`} message="Use “Assign plan” to share one of yours." />;
    return plans.map((plan) => (
      <div key={plan._id} className="activity-item align-items-center">
        <span className="activity-dot"><cfg.icon size={16} /></span>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <Link to={`${cfg.basePath}/${plan._id}`} className="fw-semibold text-decoration-none d-block text-truncate" style={{ color: 'var(--iv-text)' }}>{plan.title}</Link>
          <div className="text-muted-iv" style={{ fontSize: '.8rem' }}>
            {type === 'workout' ? <><LevelBadge level={plan.level} /> · {plan.durationInWeeks} weeks</> : `${plan.goal} · ${plan.calorieTarget} kcal`}
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" title="Unassign" aria-label={`Unassign ${plan.title}`} onClick={() => onUnassign(type, plan)}>
          <UserMinus size={16} />
        </button>
      </div>
    ));
  };

  return (
    <>
      <Link to="/trainer/members" className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={16} /> My members</Link>

      <div className="welcome-banner mb-4 d-flex flex-wrap align-items-center gap-3">
        <Avatar name={member.name} size="lg" />
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="eyebrow">Assigned member</div>
          <h1 className="font-display h2 mb-1">{member.name}</h1>
          <div className="text-muted-iv" style={{ fontSize: '.88rem' }}>
            {member.fitnessGoal ? <>Goal: <span className="text-champagne">{member.fitnessGoal}</span> · </> : null}
            Coaching since {formatDate(assignedDate)}
          </div>
        </div>
        <button type="button" className="btn btn-gold position-relative" style={{ zIndex: 1 }} onClick={() => setAssignOpen(true)}>
          <Link2 size={17} /> Assign plan
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard label="Latest weight" value={formatMetric(latest?.weight ?? member.weight, 'kg')} hint={summary.change.weight !== undefined ? `${formatChange(summary.change.weight, 'kg')} overall` : 'No change data yet'} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Body fat" value={formatMetric(latest?.bodyFatPercentage, '%')} hint={summary.change.bodyFatPercentage !== undefined ? `${formatChange(summary.change.bodyFatPercentage, '%')} overall` : '—'} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Waist" value={formatMetric(latest?.waist, 'cm')} hint={summary.change.waist !== undefined ? `${formatChange(summary.change.waist, 'cm')} overall` : '—'} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Records" value={summary.count} hint={latest ? `Last ${formatDate(latest.recordDate)}` : 'Nothing logged yet'} />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-8">
          {progress.loading ? (
            <Card><div className="skeleton" style={{ height: 300 }} /></Card>
          ) : progress.error ? (
            <Card><ErrorState message={progress.error} onRetry={progress.reload} /></Card>
          ) : (
            <ProgressChartCard records={progress.data} title="Progress monitoring" />
          )}
        </div>
        <div className="col-xl-4">
          <Card title="Profile" className="h-100">
            <div className="mb-2"><StatusBadge active={member.isActive} /></div>
            <InfoRow label="Email" value={member.email} />
            <InfoRow label="Phone" value={member.phone || '—'} />
            <InfoRow label="Age" value={member.age ?? '—'} />
            <InfoRow label="Gender" value={member.gender ? titleCase(member.gender) : '—'} />
            <InfoRow label="Height" value={member.height ? `${member.height} cm` : '—'} />
            <InfoRow label="Joined" value={formatDate(member.joinDate)} />
          </Card>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <Card title={<><Dumbbell size={17} className="text-gold me-2" />Workout plans</>}>{planRows('workout', workoutPlans)}</Card>
        </div>
        <div className="col-lg-6">
          <Card title={<><Salad size={17} className="text-gold me-2" />Diet plans</>}>{planRows('diet', dietPlans)}</Card>
        </div>
      </div>

      <Card title="Progress history" subtitle="Read-only – logged by the member" noPadding>
        {progress.loading ? (
          <div className="p-3"><div className="skeleton" style={{ height: 120 }} /></div>
        ) : progress.data?.length ? (
          <RecordsTable records={progress.data} />
        ) : (
          <EmptyState icon={LineChartIcon} title="No records yet" message={`${member.name} hasn't logged any progress.`} />
        )}
      </Card>

      <AssignPlanForMemberModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        member={member}
        assignedPlanIds={[...workoutPlans, ...dietPlans].map((p) => p._id)}
        onAssigned={detail.reload}
      />
    </>
  );
}
