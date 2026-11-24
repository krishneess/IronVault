import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Link2, Pencil, Trash2, UserMinus, Users } from 'lucide-react';
import { Avatar, Card } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import { ExerciseTable, MealList, PlanMeta } from '../../components/fitness/PlanContent';
import { AssignPlanToMemberModal } from '../../components/fitness/AssignModals';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';
import { PLAN_TYPES } from '../../components/fitness/planTypes';

export default function PlanDetail({ type }) {
  const cfg = PLAN_TYPES[type];
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [assignOpen, setAssignOpen] = useState(false);
  const { data: plan, loading, error, reload, setData } = useApiData(() => cfg.service.get(id), [type, id]);

  if (loading) return <PageLoader label={`Loading ${cfg.label.toLowerCase()}…`} />;
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;

  const onDelete = async () => {
    const ok = await confirm({
      title: `Delete “${plan.title}”?`,
      message: plan.assignedMembers.length
        ? `${plan.assignedMembers.length} member(s) will lose access to this plan. This cannot be undone.`
        : 'This plan will be permanently deleted. This cannot be undone.',
      confirmText: 'Delete plan',
    });
    if (!ok) return;
    try {
      await cfg.service.remove(plan._id);
      toast.success(`${cfg.label} deleted`, plan.title);
      navigate(cfg.basePath, { replace: true });
    } catch (err) {
      toast.error('Could not delete plan', err.message);
    }
  };

  const onUnassign = async (member) => {
    const ok = await confirm({
      title: `Remove ${member.name} from this plan?`,
      message: `${member.name} will no longer see “${plan.title}”. You can assign it again later.`,
      confirmText: 'Unassign',
    });
    if (!ok) return;
    try {
      const res = await cfg.service.unassign(plan._id, member._id);
      setData(res.data);
      toast.success('Member unassigned', `${member.name} removed from ${plan.title}.`);
    } catch (err) {
      toast.error('Could not unassign', err.message);
    }
  };

  return (
    <>
      <Link to={cfg.basePath} className="btn btn-ghost btn-sm mb-3"><ArrowLeft size={16} /> All {cfg.plural.toLowerCase()}</Link>
      <div className="row g-4">
        <div className="col-xl-8">
          <Card>
            <div className="d-flex flex-wrap justify-content-between gap-3 mb-2">
              <div>
                <div className="eyebrow mb-1">{cfg.label}</div>
                <h1 className="font-display h2 mb-2">{plan.title}</h1>
              </div>
              <div className="d-flex gap-2 align-items-start">
                <Link to={`${cfg.basePath}/${plan._id}/edit`} className="btn btn-outline-gold btn-sm"><Pencil size={15} /> Edit</Link>
                <button type="button" className="btn btn-danger-soft btn-sm" onClick={onDelete}><Trash2 size={15} /> Delete</button>
              </div>
            </div>
            <PlanMeta type={type} plan={plan} />
            {plan.description && <p className="text-muted-iv mt-3 mb-0" style={{ whiteSpace: 'pre-line' }}>{plan.description}</p>}
            <hr className="divider-gold my-4" />
            {type === 'workout' ? <ExerciseTable exercises={plan.exercises} /> : <MealList meals={plan.meals} calorieTarget={plan.calorieTarget} />}
          </Card>
        </div>
        <div className="col-xl-4">
          <Card
            title="Assigned members"
            subtitle={`${plan.assignedMembers.length} following this plan`}
            actions={<button type="button" className="btn btn-gold btn-sm" onClick={() => setAssignOpen(true)}><Link2 size={15} /> Assign</button>}
          >
            {!plan.assignedMembers.length ? (
              <EmptyState icon={Users} title="Not assigned yet" message="Assign this plan to one of your members." />
            ) : (
              plan.assignedMembers
                .filter((a) => a.member)
                .map(({ member, assignedAt }) => (
                  <div key={member._id} className="activity-item align-items-center">
                    <Avatar name={member.name} />
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <Link to={`/trainer/members/${member._id}`} className="fw-semibold text-decoration-none d-block text-truncate" style={{ color: 'var(--iv-text)' }}>{member.name}</Link>
                      <div className="text-muted-iv" style={{ fontSize: '.78rem' }}>Since {formatDate(assignedAt)}</div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" title="Unassign" aria-label={`Unassign ${member.name}`} onClick={() => onUnassign(member)}>
                      <UserMinus size={16} />
                    </button>
                  </div>
                ))
            )}
          </Card>
        </div>
      </div>
      <AssignPlanToMemberModal open={assignOpen} type={type} plan={plan} onClose={() => setAssignOpen(false)} onAssigned={setData} />
    </>
  );
}
