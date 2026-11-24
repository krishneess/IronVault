import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Power, PowerOff, UserPlus, Users } from 'lucide-react';
import { Avatar, Card, PageHeader, StatusBadge } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import AccountFormModal from '../../components/admin/AccountFormModal';
import { toggleMemberStatus } from '../../components/admin/accountStatus';
import { MembershipStatusBadge } from '../../components/membership/membershipUi';
import { STATUS_META, STATUS_ORDER } from '../../components/membership/membershipMeta';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { adminMemberService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';

export default function AdminMembers() {
  const confirm = useConfirm();
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', status: '', membership: '', assignment: '', page: 1 });
  const [modal, setModal] = useState(null); // { account } | { account: null }
  const { data, meta, loading, error, reload } = useApiData(() => adminMemberService.list({ ...filters, limit: 15 }), [filters]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  const onSearch = useCallback((v) => setFilters((f) => ({ ...f, search: v, page: 1 })), []);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Members"
        description="Manage member accounts, memberships and trainer allocation."
        actions={<button type="button" className="btn btn-gold" onClick={() => setModal({ account: null })}><UserPlus size={18} /> Add member</button>}
      />
      <Card noPadding>
        <div className="d-flex flex-wrap gap-2 p-3 filter-bar" style={{ borderBottom: '1px solid var(--iv-border-soft)' }}>
          <SearchInput value={filters.search} onSearch={onSearch} placeholder="Search name, email, username, phone…" className="flex-grow-1" />
          <select className="form-select" style={{ width: 150 }} value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Account status">
            <option value="">All accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="form-select" style={{ width: 190 }} value={filters.membership} onChange={(e) => setFilter('membership', e.target.value)} aria-label="Membership status">
            <option value="">All memberships</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            <option value="none">No open membership</option>
          </select>
          <select className="form-select" style={{ width: 170 }} value={filters.assignment} onChange={(e) => setFilter('assignment', e.target.value)} aria-label="Trainer assignment">
            <option value="">Any trainer</option>
            <option value="assigned">Has trainer</option>
            <option value="unassigned">No trainer</option>
          </select>
        </div>
        {loading ? (
          <div className="p-3">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton mb-2" style={{ height: 50 }} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data.length ? (
          <EmptyState icon={Users} title="No members found" message="Adjust the filters or add a new member." />
        ) : (
          <div className="table-responsive">
            <table className="table iv-table table-hover">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Account</th>
                  <th>Membership</th>
                  <th>Trainer</th>
                  <th>Joined</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <Link to={`/admin/members/${m._id}`} className="d-flex align-items-center gap-2 text-decoration-none" style={{ color: 'var(--iv-text)' }}>
                        <Avatar name={m.name} />
                        <span style={{ minWidth: 0 }}>
                          <span className="d-block fw-semibold">{m.name}</span>
                          <span className="d-block text-muted-iv" style={{ fontSize: '.78rem' }}>{m.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td><StatusBadge active={m.isActive} /></td>
                    <td>
                      {m.membership ? (
                        <span className="d-flex flex-column gap-1">
                          <MembershipStatusBadge status={m.membership.status} />
                          <span className="text-muted-iv" style={{ fontSize: '.76rem' }}>
                            {m.membership.planType}
                            {m.membership.status === 'active' && ` · ${m.membership.validity.daysRemaining}d left`}
                          </span>
                        </span>
                      ) : (
                        <MembershipStatusBadge status="none" />
                      )}
                    </td>
                    <td className="text-nowrap">{m.trainer ? m.trainer.name : <span className="text-muted-iv">Unassigned</span>}</td>
                    <td className="text-nowrap text-muted-iv">{formatDate(m.joinDate)}</td>
                    <td className="text-end text-nowrap">
                      <Link to={`/admin/members/${m._id}`} className="btn btn-ghost btn-icon btn-sm" title="View" aria-label={`View ${m.name}`}><Eye size={16} /></Link>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" title="Edit" aria-label={`Edit ${m.name}`} onClick={() => setModal({ account: m })}><Pencil size={16} /></button>
                      <button
                        type="button"
                        className={`btn btn-ghost btn-icon btn-sm ${m.isActive ? 'text-danger' : 'text-success'}`}
                        title={m.isActive ? 'Deactivate' : 'Reactivate'}
                        aria-label={`${m.isActive ? 'Deactivate' : 'Reactivate'} ${m.name}`}
                        onClick={() => toggleMemberStatus({ member: m, confirm, toast, onDone: reload })}
                      >
                        {m.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
      </Card>
      {modal && <AccountFormModal role="member" account={modal.account} onClose={() => setModal(null)} onSaved={reload} />}
    </>
  );
}
