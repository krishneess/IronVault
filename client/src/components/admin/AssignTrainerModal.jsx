import { useState } from 'react';
import { Check, UserCog } from 'lucide-react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { Avatar } from '../common/Display';
import { EmptyState, ErrorState, Spinner } from '../common/Feedback';
import { useToast } from '../../context/ToastContext';
import { adminTrainerService, assignmentAdminService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';

/** Assign or reassign a trainer to a member, showing each trainer's current load. */
export default function AssignTrainerModal({ member, currentTrainerId, onClose, onDone }) {
  const toast = useToast();
  const { data: trainers, loading, error, reload } = useApiData(() => adminTrainerService.options(), []);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const reassign = Boolean(currentTrainerId);

  const submit = async () => {
    setSaving(true);
    try {
      await assignmentAdminService.assign(member._id, selected, notes.trim() || undefined);
      const t = trainers.find((x) => x._id === selected);
      toast.success(reassign ? 'Trainer reassigned' : 'Trainer assigned', `${t?.name} now coaches ${member.name}.`);
      onDone?.();
      onClose();
    } catch (err) {
      toast.error('Could not assign trainer', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={saving}
      title={`${reassign ? 'Reassign' : 'Assign'} trainer`}
      subtitle={member.name}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-gold" onClick={submit} disabled={!selected || saving}>
            {saving ? <Spinner small /> : <UserCog size={17} />} {reassign ? 'Reassign' : 'Assign'}
          </button>
        </>
      }
    >
      {reassign && (
        <div className="auth-alert" style={{ color: '#f2cd88', background: 'rgba(232,176,74,.08)', borderColor: 'rgba(232,176,74,.3)' }}>
          The current trainer’s plans will be removed from this member, and that trainer will lose access to their progress.
        </div>
      )}
      {loading ? (
        <div className="text-center py-4"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !trainers.length ? (
        <EmptyState icon={UserCog} title="No active trainers" message="Add a trainer account first." />
      ) : (
        <>
          {trainers.map((t) => {
            const current = t._id === currentTrainerId;
            return (
              <button
                key={t._id}
                type="button"
                disabled={current}
                onClick={() => setSelected(t._id)}
                className="w-100 text-start d-flex align-items-center gap-3 p-3 mb-2 rounded-3"
                style={{
                  background: selected === t._id ? 'var(--iv-gold-08)' : 'var(--iv-bg-elevated)',
                  border: `1px solid ${selected === t._id ? 'var(--iv-gold)' : 'var(--iv-border)'}`,
                  color: 'inherit',
                  opacity: current ? 0.5 : 1,
                }}
                aria-pressed={selected === t._id}
              >
                <Avatar name={t.name} />
                <span className="flex-grow-1" style={{ minWidth: 0 }}>
                  <span className="d-block fw-semibold">{t.name}{current && ' (current)'}</span>
                  <span className="d-block text-muted-iv" style={{ fontSize: '.8rem' }}>{t.specialization}</span>
                </span>
                <span className="text-end" style={{ fontSize: '.8rem' }}>
                  <span className="d-block fw-bold">{t.activeMembers}</span>
                  <span className="text-muted-iv">members</span>
                </span>
                {selected === t._id && <Check size={18} className="text-gold" />}
              </button>
            );
          })}
          <FormField className="mt-3 mb-0" label="Notes" name="notes" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional – e.g. goals, schedule preferences" />
        </>
      )}
    </Modal>
  );
}
