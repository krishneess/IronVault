import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCog, UserMinus, Users } from 'lucide-react';
import { Avatar, Card, PageHeader } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import AssignTrainerModal from '../../components/admin/AssignTrainerModal';
import { MembershipStatusBadge } from '../../components/membership/membershipUi';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { adminMemberService, adminTrainerService, assignmentAdminService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';

/** Trainer allocation – assign, reassign and end trainer ↔ member assignments. */
export default function AdminAllocation() {
  const confirm = useConfirm();
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', assignment: 'unassigned', page: 1 });
  const [assigning, setAssigning] = useState(null);
  const members = useApiData(() => adminMemberService.list({ ...filters, status: 'active', limit: 12 }), [filters]);
  const trainers = useApiData(() => adminTrainerService.options(), []);
  const onSearch = useCallback((v) => setFilters((f) => ({ ...f, search: v, page: 1 })), []);

  const refresh = () => {
    members.reload();
    trainers.reload();
  };

  const end = async (m) => {
    const ok = await confirm({
      title: `Unassign ${m.trainer.name} from ${m.name}?`,
      message: "The trainer's plans will be removed from the member and the trainer loses access to their progress.",
      confirmText: 'Unassign',
    });
    if (!ok) return;
    try {
      await assignmentAdminService.end(m._id);
      toast.success('Assignment ended', m.name);
      refresh();
    } catch (err) {
      toast.error('Could not end assignment', err.message);
    }
  };

  const maxLoad = Math.max(1, ...(trainers.data || []).map((t) => t.activeMembers));

  return (
    <>
      <PageHeader eyebrow="Administration" title="Trainer allocation" description="Match members with trainers and balance coaching load." />
      <div className="row g-4">
        <div className="col-xl-8">
          <Card noPadding>
            <div className="d-flex flex-wrap gap-2 p-3 filter-bar" style={{ borderBottom: '1px solid var(--iv-border-soft)' }}>
              <div className="d-flex gap-2" role="tablist">
                {[
                  ['unassigned', 'Needs trainer'],
                  ['assigned', 'Assigned'],
                  ['', 'All'],
                ].map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={filters.assignment === value}
                    className={`btn btn-sm ${filters.assignment === value ? 'btn-gold' : 'btn-outline-gold'}`}
                    onClick={() => setFilters((f) => ({ ...f, assignment: value, page: 1 }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <SearchInput value={filters.search} onSearch={onSearch} placeholder="Search members…" className="flex-grow-1" />
            </div>
            {members.loading ? (
              <div className="p-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton mb-2" style={{ height: 50 }} />)}</div>
            ) : members.error ? (
              <ErrorState message={members.error} onRetry={members.reload} />
            ) : !members.data.length ? (
              <EmptyState icon={Users} title={filters.assignment === 'unassigned' ? 'Every active member has a trainer' : 'No members found'} />
            ) : (
              <div className="table-responsive">
                <table className="table iv-table table-hover">
                  <thead><tr><th>Member</th><th>Membership</th><th>Trainer</th><th className="text-end">Action</th></tr></thead>
                  <tbody>
                    {members.data.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <Link to={`/admin/members/${m._id}`} className="d-flex align-items-center gap-2 text-decoration-none" style={{ color: 'var(--iv-text)' }}>
                            <Avatar name={m.name} />
                            <span>
                              <span className="d-block fw-semibold">{m.name}</span>
                              <span className="d-block text-muted-iv" style={{ fontSize: '.78rem' }}>{m.fitnessGoal || m.email}</span>
                            </span>
                          </Link>
                        </td>
                        <td><MembershipStatusBadge status={m.membership?.status || 'none'} /></td>
                        <td>{m.trainer ? m.trainer.name : <span className="text-muted-iv">—</span>}</td>
                        <td className="text-end text-nowrap">
                          <button type="button" className="btn btn-outline-gold btn-sm" onClick={() => setAssigning(m)}>
                            <UserCog size={15} /> {m.trainer ? 'Reassign' : 'Assign'}
                          </button>
                          {m.trainer && (
                            <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger ms-1" title="Unassign" aria-label={`Unassign trainer from ${m.name}`} onClick={() => end(m)}>
                              <UserMinus size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination meta={members.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
          </Card>
        </div>
        <div className="col-xl-4">
          <Card title="Trainer load" subtitle="Active members per trainer">
            {trainers.loading ? (
              <div className="skeleton" style={{ height: 160 }} />
            ) : trainers.error ? (
              <ErrorState message={trainers.error} onRetry={trainers.reload} />
            ) : !trainers.data.length ? (
              <EmptyState icon={UserCog} title="No active trainers" />
            ) : (
              trainers.data.map((t) => (
                <div key={t._id} className="mb-3">
                  <div className="d-flex justify-content-between" style={{ fontSize: '.86rem' }}>
                    <Link to={`/admin/trainers/${t._id}`} className="fw-semibold text-decoration-none" style={{ color: 'var(--iv-text)' }}>{t.name}</Link>
                    <span className="fw-semibold">{t.activeMembers}</span>
                  </div>
                  <div className="text-muted-iv mb-1" style={{ fontSize: '.76rem' }}>{t.specialization}</div>
                  <div style={{ height: 8, borderRadius: 8, background: 'var(--iv-surface-3)', overflow: 'hidden' }}>
                    <div style={{ width: `${(t.activeMembers / maxLoad) * 100}%`, height: '100%', background: 'var(--iv-gold-gradient)' }} />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
      {assigning && <AssignTrainerModal member={assigning} currentTrainerId={assigning.trainer?._id} onClose={() => setAssigning(null)} onDone={refresh} />}
    </>
  );
}
