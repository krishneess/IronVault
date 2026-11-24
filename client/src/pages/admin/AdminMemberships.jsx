import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Plus } from 'lucide-react';
import { Card, PageHeader } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import CreateMembershipModal from '../../components/admin/CreateMembershipModal';
import TransitionModal from '../../components/membership/TransitionModal';
import { MembershipStatusBadge } from '../../components/membership/membershipUi';
import { STATUS_META, STATUS_ORDER, formatMoney } from '../../components/membership/membershipMeta';
import { membershipService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';

const DANGER = ['terminate', 'revoke', 'cancel_application', 'abandon_payment', 'decline_renewal'];

/** Subscription management – every membership with state-chart actions. */
export default function AdminMemberships() {
  const [filters, setFilters] = useState({ status: 'payment_pending', search: '', page: 1 });
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(null); // { membership, action }
  const list = useApiData(() => membershipService.list({ ...filters, limit: 15 }), [filters]);
  const summary = useApiData(() => membershipService.summary(), []);
  const onSearch = useCallback((v) => setFilters((f) => ({ ...f, search: v, page: 1 })), []);

  const refresh = () => {
    list.reload();
    summary.reload();
  };

  const counts = summary.data?.counts || {};

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Subscriptions"
        description="Verify payments, manage holds and follow every membership through its lifecycle."
        actions={<button type="button" className="btn btn-gold" onClick={() => setCreating(true)}><Plus size={18} /> New membership</button>}
      />

      <div className="d-flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Filter by status">
        {[...STATUS_ORDER, ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            role="tab"
            aria-selected={filters.status === s}
            className={`btn btn-sm ${filters.status === s ? 'btn-gold' : 'btn-outline-gold'}`}
            onClick={() => setFilters((f) => ({ ...f, status: s, page: 1 }))}
          >
            {s ? STATUS_META[s].label : 'All'}
            {s && <span className="ms-1 opacity-75">({counts[s] ?? 0})</span>}
          </button>
        ))}
      </div>

      <Card noPadding>
        <div className="p-3" style={{ borderBottom: '1px solid var(--iv-border-soft)' }}>
          <SearchInput value={filters.search} onSearch={onSearch} placeholder="Search by member name or email…" />
        </div>
        {list.loading ? (
          <div className="p-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton mb-2" style={{ height: 50 }} />)}</div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data.length ? (
          <EmptyState icon={Crown} title="No memberships in this view" message={filters.status === 'payment_pending' ? 'No payments are waiting for verification.' : 'Try another status or search.'} />
        ) : (
          <div className="table-responsive">
            <table className="table iv-table table-hover">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Validity</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((m) => (
                  <tr key={m._id}>
                    <td>
                      {m.member ? (
                        <Link to={`/admin/members/${m.member._id}`} className="text-decoration-none" style={{ color: 'var(--iv-text)' }}>
                          <span className="d-block fw-semibold">{m.member.name}</span>
                          <span className="d-block text-muted-iv" style={{ fontSize: '.78rem' }}>{m.member.email}</span>
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="fw-semibold">{m.planType}</td>
                    <td><MembershipStatusBadge status={m.status} /></td>
                    <td>{formatMoney(m.fee)}</td>
                    <td className="text-nowrap text-muted-iv" style={{ fontSize: '.85rem' }}>
                      {m.status === 'active' ? `${m.validity.daysRemaining} days left · ${formatDate(m.endDate)}` : m.startDate ? `${formatDate(m.startDate)} – ${formatDate(m.endDate)}` : `Created ${formatDate(m.createdAt)}`}
                    </td>
                    <td className="text-end" style={{ minWidth: 220 }}>
                      <div className="d-flex flex-wrap justify-content-end gap-1 text-nowrap">
                        {m.member?.isActive === false ? (
                          <span className="text-muted-iv" style={{ fontSize: '.8rem' }}>Account inactive</span>
                        ) : (
                          m.actions.map((a) => (
                            <button key={a.action} type="button" className={`btn btn-sm ${DANGER.includes(a.action) ? 'btn-danger-soft' : 'btn-outline-gold'}`} onClick={() => setPending({ membership: m, action: a })}>
                              {a.label}
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={list.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
      </Card>

      {creating && <CreateMembershipModal onClose={() => setCreating(false)} onDone={refresh} />}
      {pending && (
        <TransitionModal key={pending.membership._id + pending.action.action} membership={pending.membership} action={pending.action} onClose={() => setPending(null)} onDone={refresh} />
      )}
    </>
  );
}
