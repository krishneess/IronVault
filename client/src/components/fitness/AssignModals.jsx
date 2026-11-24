import { useMemo, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import Modal from '../common/Modal';
import { Avatar } from '../common/Display';
import { EmptyState, ErrorState, Spinner } from '../common/Feedback';
import { useToast } from '../../context/ToastContext';
import { trainerService } from '../../services/fitnessService';
import { PLAN_TYPES } from './planTypes';
import useApiData from '../../hooks/useApiData';
import { pluralize } from '../../utils/format';
import { Users } from 'lucide-react';

function ChoiceRow({ selected, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-100 text-start d-flex align-items-center gap-3 p-3 mb-2 rounded-3"
      style={{
        background: selected ? 'var(--iv-gold-08)' : 'var(--iv-bg-elevated)',
        border: `1px solid ${selected ? 'var(--iv-gold)' : 'var(--iv-border)'}`,
        color: 'inherit',
        opacity: disabled ? 0.5 : 1,
      }}
      aria-pressed={selected}
    >
      {children}
      {selected && <Check size={18} className="text-gold ms-auto flex-shrink-0" />}
    </button>
  );
}

/** Assign one plan to one of the trainer's members. */
export function AssignPlanToMemberModal({ open, onClose, type, plan, onAssigned }) {
  const cfg = PLAN_TYPES[type];
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useApiData(() => (open ? trainerService.members() : Promise.resolve({ data: [] })), [open]);

  const assignedIds = useMemo(() => new Set((plan?.assignedMembers || []).map((a) => a.member?._id || a.member)), [plan]);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await cfg.service.assign(plan._id, selected);
      toast.success(`${cfg.label} assigned`, res.message);
      onAssigned?.(res.data);
      setSelected(null);
      onClose();
    } catch (err) {
      toast.error('Could not assign plan', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={`Assign “${plan?.title || ''}”`}
      subtitle="Choose one of your assigned members"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-gold" onClick={submit} disabled={!selected || saving}>
            {saving ? <Spinner small /> : <Link2 size={17} />} Assign plan
          </button>
        </>
      }
    >
      {loading ? (
        <div className="text-center py-4"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data.length ? (
        <EmptyState icon={Users} title="No members assigned to you" message="An administrator must assign members to you before you can share plans." />
      ) : (
        data.map(({ member }) => {
          const already = assignedIds.has(member._id);
          return (
            <ChoiceRow key={member._id} selected={selected === member._id} disabled={already} onClick={() => setSelected(member._id)}>
              <Avatar name={member.name} />
              <span style={{ minWidth: 0 }}>
                <span className="d-block fw-semibold">{member.name}</span>
                <span className="d-block text-muted-iv text-truncate" style={{ fontSize: '.8rem' }}>
                  {already ? 'Already following this plan' : member.email}
                </span>
              </span>
            </ChoiceRow>
          );
        })
      )}
    </Modal>
  );
}

/** Assign one of the trainer's plans (workout or diet) to a specific member. */
export function AssignPlanForMemberModal({ open, onClose, member, assignedPlanIds = [], onAssigned }) {
  const toast = useToast();
  const [type, setType] = useState('workout');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const cfg = PLAN_TYPES[type];
  const { data, loading, error, reload } = useApiData(() => (open ? cfg.service.list() : Promise.resolve({ data: [] })), [open, type]);
  const assigned = new Set(assignedPlanIds);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await cfg.service.assign(selected, member._id);
      toast.success(`${cfg.label} assigned`, `${member.name} can now see this plan.`);
      onAssigned?.(res.data);
      setSelected(null);
      onClose();
    } catch (err) {
      toast.error('Could not assign plan', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={`Assign a plan to ${member?.name || ''}`}
      subtitle="Pick one of your workout or diet plans"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-gold" onClick={submit} disabled={!selected || saving}>
            {saving ? <Spinner small /> : <Link2 size={17} />} Assign plan
          </button>
        </>
      }
    >
      <div className="d-flex gap-2 mb-3" role="tablist">
        {Object.values(PLAN_TYPES).map((t) => (
          <button
            key={t.type}
            type="button"
            role="tab"
            aria-selected={type === t.type}
            className={`btn btn-sm ${type === t.type ? 'btn-gold' : 'btn-outline-gold'}`}
            onClick={() => {
              setType(t.type);
              setSelected(null);
            }}
          >
            <t.icon size={15} /> {t.plural}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-4"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data.length ? (
        <EmptyState icon={cfg.icon} title={`You have no ${cfg.plural.toLowerCase()}`} message={`Create a ${cfg.label.toLowerCase()} first, then assign it here.`} />
      ) : (
        data.map((plan) => {
          const already = assigned.has(plan._id);
          return (
            <ChoiceRow key={plan._id} selected={selected === plan._id} disabled={already} onClick={() => setSelected(plan._id)}>
              <span className="stat-icon flex-shrink-0"><cfg.icon size={18} /></span>
              <span style={{ minWidth: 0 }}>
                <span className="d-block fw-semibold">{plan.title}</span>
                <span className="d-block text-muted-iv" style={{ fontSize: '.8rem' }}>
                  {already
                    ? 'Already assigned to this member'
                    : type === 'workout'
                      ? `${plan.level} · ${pluralize(plan.durationInWeeks, "week")} · ${pluralize(plan.exercises.length, "exercise")}`
                      : `${plan.goal} · ${plan.calorieTarget} kcal · ${pluralize(plan.meals.length, "meal")}`}
                </span>
              </span>
            </ChoiceRow>
          );
        })
      )}
    </Modal>
  );
}
