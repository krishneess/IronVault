import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Link2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Card, PageHeader } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import SearchInput from '../../components/common/SearchInput';
import { LevelBadge } from '../../components/fitness/PlanContent';
import { AssignPlanToMemberModal } from '../../components/fitness/AssignModals';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';
import { PLAN_TYPES } from '../../components/fitness/planTypes';

/** Trainer's own workout or diet plans with search, filters and actions. */
export default function PlansList({ type }) {
  const cfg = PLAN_TYPES[type];
  const confirm = useConfirm();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [assignPlan, setAssignPlan] = useState(null);
  const { data: plans, loading, error, reload } = useApiData(() => cfg.service.list({ search, level }), [type, search, level]);
  const onSearch = useCallback((v) => setSearch(v), []);

  const onDelete = async (plan) => {
    const followers = plan.assignedMembers?.length || 0;
    const ok = await confirm({
      title: `Delete “${plan.title}”?`,
      message: followers
        ? `This plan is assigned to ${followers} member${followers === 1 ? '' : 's'}. They will lose access to it. This cannot be undone.`
        : 'This plan will be permanently deleted. This cannot be undone.',
      confirmText: 'Delete plan',
    });
    if (!ok) return;
    try {
      await cfg.service.remove(plan._id);
      toast.success(`${cfg.label} deleted`, plan.title);
      reload();
    } catch (err) {
      toast.error('Could not delete plan', err.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Trainer"
        title={cfg.plural}
        description={`Create, update and assign ${cfg.plural.toLowerCase()} to your members.`}
        actions={
          <Link to={`${cfg.basePath}/new`} className="btn btn-gold">
            <Plus size={18} /> New {cfg.label.toLowerCase()}
          </Link>
        }
      />

      <Card noPadding>
        <div className="d-flex flex-wrap gap-2 p-3 border-bottom filter-bar" style={{ borderColor: 'var(--iv-border-soft)' }}>
          <SearchInput value={search} onSearch={onSearch} placeholder={`Search ${cfg.plural.toLowerCase()}…`} className="flex-grow-1" />
          {type === 'workout' && (
            <select className="form-select" style={{ width: 180 }} value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level">
              <option value="">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="p-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton mb-2" style={{ height: 52 }} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !plans.length ? (
          <EmptyState
            icon={cfg.icon}
            title={search || level ? 'No plans match your filters' : `No ${cfg.plural.toLowerCase()} yet`}
            message={search || level ? 'Try a different search or filter.' : `Create your first ${cfg.label.toLowerCase()} to assign it to members.`}
            action={!search && !level && <Link to={`${cfg.basePath}/new`} className="btn btn-gold"><Plus size={17} /> Create plan</Link>}
          />
        ) : (
          <div className="table-responsive">
            <table className="table iv-table table-hover">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>{type === 'workout' ? 'Level' : 'Goal'}</th>
                  <th className="text-center">{type === 'workout' ? 'Duration' : 'Calories'}</th>
                  <th className="text-center">{type === 'workout' ? 'Exercises' : 'Meals'}</th>
                  <th className="text-center">Members</th>
                  <th>Updated</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan._id}>
                    <td style={{ minWidth: 200 }}>
                      <Link to={`${cfg.basePath}/${plan._id}`} className="fw-semibold text-decoration-none" style={{ color: 'var(--iv-text)' }}>
                        {plan.title}
                      </Link>
                      {plan.description && <div className="text-muted-iv text-truncate" style={{ fontSize: '.8rem', maxWidth: 280 }}>{plan.description}</div>}
                    </td>
                    <td>{type === 'workout' ? <LevelBadge level={plan.level} /> : plan.goal}</td>
                    <td className="text-center text-nowrap">{type === 'workout' ? `${plan.durationInWeeks} wks` : `${plan.calorieTarget} kcal`}</td>
                    <td className="text-center">{plan[cfg.itemsKey].length}</td>
                    <td className="text-center">
                      <span className="d-inline-flex align-items-center gap-1"><Users size={14} className="text-gold" /> {plan.assignedMembers.length}</span>
                    </td>
                    <td className="text-nowrap text-muted-iv">{formatDate(plan.updatedAt)}</td>
                    <td className="text-end text-nowrap">
                      <Link to={`${cfg.basePath}/${plan._id}`} className="btn btn-ghost btn-icon btn-sm" title="View" aria-label={`View ${plan.title}`}><Eye size={16} /></Link>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" title="Assign to member" aria-label={`Assign ${plan.title}`} onClick={() => setAssignPlan(plan)}><Link2 size={16} /></button>
                      <Link to={`${cfg.basePath}/${plan._id}/edit`} className="btn btn-ghost btn-icon btn-sm" title="Edit" aria-label={`Edit ${plan.title}`}><Pencil size={16} /></Link>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" title="Delete" aria-label={`Delete ${plan.title}`} onClick={() => onDelete(plan)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AssignPlanToMemberModal open={Boolean(assignPlan)} type={type} plan={assignPlan} onClose={() => setAssignPlan(null)} onAssigned={reload} />
    </>
  );
}
