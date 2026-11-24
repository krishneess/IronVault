import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Power, PowerOff, UserCog, UserPlus } from 'lucide-react';
import { Avatar, Card, PageHeader, StatusBadge } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import AccountFormModal from '../../components/admin/AccountFormModal';
import { toggleTrainerStatus } from '../../components/admin/accountStatus';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { adminTrainerService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';

export default function AdminTrainers() {
  const confirm = useConfirm();
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [modal, setModal] = useState(null);
  const { data, meta, loading, error, reload } = useApiData(() => adminTrainerService.list({ ...filters, limit: 15 }), [filters]);
  const onSearch = useCallback((v) => setFilters((f) => ({ ...f, search: v, page: 1 })), []);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Trainers"
        description="Manage trainer accounts and see their coaching load."
        actions={<button type="button" className="btn btn-gold" onClick={() => setModal({ account: null })}><UserPlus size={18} /> Add trainer</button>}
      />
      <Card noPadding>
        <div className="d-flex flex-wrap gap-2 p-3 filter-bar" style={{ borderBottom: '1px solid var(--iv-border-soft)' }}>
          <SearchInput value={filters.search} onSearch={onSearch} placeholder="Search trainers…" className="flex-grow-1" />
          <select className="form-select" style={{ width: 160 }} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} aria-label="Account status">
            <option value="">All accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {loading ? (
          <div className="p-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton mb-2" style={{ height: 50 }} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data.length ? (
          <EmptyState icon={UserCog} title="No trainers found" message="Adjust the filters or add a trainer." />
        ) : (
          <div className="table-responsive">
            <table className="table iv-table table-hover">
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>Specialization</th>
                  <th className="text-center">Experience</th>
                  <th className="text-center">Members</th>
                  <th className="text-center">Plans</th>
                  <th>Account</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <Link to={`/admin/trainers/${t._id}`} className="d-flex align-items-center gap-2 text-decoration-none" style={{ color: 'var(--iv-text)' }}>
                        <Avatar name={t.name} />
                        <span>
                          <span className="d-block fw-semibold">{t.name}</span>
                          <span className="d-block text-muted-iv" style={{ fontSize: '.78rem' }}>{t.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td>{t.specialization}</td>
                    <td className="text-center">{t.experience ?? 0} yrs</td>
                    <td className="text-center fw-semibold">{t.stats.activeMembers}</td>
                    <td className="text-center text-muted-iv">{t.stats.workoutPlans} workout · {t.stats.dietPlans} diet</td>
                    <td><StatusBadge active={t.isActive} /></td>
                    <td className="text-end text-nowrap">
                      <Link to={`/admin/trainers/${t._id}`} className="btn btn-ghost btn-icon btn-sm" title="View" aria-label={`View ${t.name}`}><Eye size={16} /></Link>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" title="Edit" aria-label={`Edit ${t.name}`} onClick={() => setModal({ account: t })}><Pencil size={16} /></button>
                      <button
                        type="button"
                        className={`btn btn-ghost btn-icon btn-sm ${t.isActive ? 'text-danger' : 'text-success'}`}
                        title={t.isActive ? 'Deactivate' : 'Reactivate'}
                        aria-label={`${t.isActive ? 'Deactivate' : 'Reactivate'} ${t.name}`}
                        onClick={() => toggleTrainerStatus({ trainer: t, confirm, toast, onDone: reload })}
                      >
                        {t.isActive ? <PowerOff size={16} /> : <Power size={16} />}
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
      {modal && <AccountFormModal role="trainer" account={modal.account} onClose={() => setModal(null)} onSaved={reload} />}
    </>
  );
}
