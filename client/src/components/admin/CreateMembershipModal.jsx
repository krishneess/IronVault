import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import SearchInput from '../common/SearchInput';
import { Avatar } from '../common/Display';
import { ErrorState, Spinner } from '../common/Feedback';
import { useToast } from '../../context/ToastContext';
import { adminMemberService, membershipService, tierService } from '../../services/adminService';
import { durationLabel, formatMoney } from '../membership/membershipMeta';
import useApiData from '../../hooks/useApiData';

/** Admin creates a membership (Created state) for a member – member fixed or picked by search. */
export default function CreateMembershipModal({ member: fixedMember, onClose, onDone }) {
  const toast = useToast();
  const [member, setMember] = useState(fixedMember || null);
  const [search, setSearch] = useState('');
  const [tierId, setTierId] = useState('');
  const [saving, setSaving] = useState(false);
  const tiers = useApiData(() => tierService.listPublic(), []);
  const members = useApiData(
    () => (fixedMember ? Promise.resolve({ data: [] }) : adminMemberService.list({ search, status: 'active', membership: 'none', limit: 8 })),
    [search]
  );
  const onSearch = useCallback((v) => setSearch(v), []);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await membershipService.createForMember(member._id, tierId);
      toast.success('Membership created', `${res.data.planType} for ${member.name} – submit it to move to payment.`);
      onDone?.(res.data);
      onClose();
    } catch (err) {
      toast.error('Could not create membership', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={saving}
      title="New membership"
      subtitle={member ? member.name : 'Choose a member without an open membership'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-gold" onClick={submit} disabled={!member || !tierId || saving}>
            {saving ? <Spinner small /> : <Crown size={17} />} Create membership
          </button>
        </>
      }
    >
      {!fixedMember && (
        <div className="mb-3">
          <label className="form-label">Member</label>
          <SearchInput value={search} onSearch={onSearch} placeholder="Search members by name or email…" />
          <div className="mt-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {members.loading ? (
              <div className="text-center py-3"><Spinner small /></div>
            ) : members.error ? (
              <ErrorState message={members.error} onRetry={members.reload} />
            ) : !members.data.length ? (
              <div className="text-muted-iv py-2" style={{ fontSize: '.85rem' }}>No eligible members found.</div>
            ) : (
              members.data.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setMember(m)}
                  className="w-100 text-start d-flex align-items-center gap-2 p-2 mb-1 rounded-3"
                  style={{ background: member?._id === m._id ? 'var(--iv-gold-08)' : 'transparent', border: `1px solid ${member?._id === m._id ? 'var(--iv-gold)' : 'var(--iv-border-soft)'}`, color: 'inherit' }}
                >
                  <Avatar name={m.name} />
                  <span style={{ minWidth: 0 }}>
                    <span className="d-block fw-semibold">{m.name}</span>
                    <span className="d-block text-muted-iv text-truncate" style={{ fontSize: '.78rem' }}>{m.email}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {tiers.loading ? (
        <Spinner small />
      ) : tiers.error ? (
        <ErrorState message={tiers.error} onRetry={tiers.reload} />
      ) : !tiers.data?.length ? (
        <div className="auth-alert mb-0" style={{ color: '#f2cd88', background: 'rgba(232,176,74,.08)', borderColor: 'rgba(232,176,74,.3)' }}>
          <Crown size={18} className="flex-shrink-0 mt-1" />
          <span>
            There are no active membership tiers yet. Create one under{' '}
            <Link to="/admin/tiers" className="fw-semibold" onClick={onClose}>Membership Tiers</Link>, then come back to add the membership.
          </span>
        </div>
      ) : (
        <FormField label="Membership tier" as="select" value={tierId} onChange={(e) => setTierId(e.target.value)} required className="mb-0">
          <option value="">Select a tier</option>
          {(tiers.data || []).map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} – {formatMoney(t.price)} / {durationLabel(t.durationInDays)}
            </option>
          ))}
        </FormField>
      )}
    </Modal>
  );
}
