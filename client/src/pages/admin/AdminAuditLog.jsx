import { useCallback, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { Card, PageHeader, RoleBadge, Badge } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { reportService } from '../../services/adminService';
import useApiData from '../../hooks/useApiData';
import { formatDateTime, titleCase } from '../../utils/format';

/** System activity monitor over the audit records. */
export default function AdminAuditLog() {
  const [filters, setFilters] = useState({ search: '', action: '', actorRole: '', from: '', to: '', page: 1 });
  const { data, meta, loading, error, reload } = useApiData(() => reportService.auditLogs({ ...filters, limit: 25 }), [filters]);
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  const onSearch = useCallback((v) => setFilters((f) => ({ ...f, search: v, page: 1 })), []);
  const dateError = filters.from && filters.to && filters.from > filters.to;

  return (
    <>
      <PageHeader eyebrow="Administration" title="Activity log" description="Audit records of sign-ins, account, plan and membership changes." />
      <Card noPadding>
        <div className="d-flex flex-wrap gap-2 p-3 filter-bar" style={{ borderBottom: '1px solid var(--iv-border-soft)' }}>
          <SearchInput value={filters.search} onSearch={onSearch} placeholder="Search descriptions…" className="flex-grow-1" />
          <select className="form-select" style={{ width: 230 }} value={filters.action} onChange={(e) => set('action', e.target.value)} aria-label="Action">
            <option value="">All actions</option>
            {(meta?.actions || []).map((a) => <option key={a} value={a}>{titleCase(a)}</option>)}
          </select>
          <select className="form-select" style={{ width: 150 }} value={filters.actorRole} onChange={(e) => set('actorRole', e.target.value)} aria-label="Actor role">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="trainer">Trainer</option>
            <option value="member">Member</option>
            <option value="system">System</option>
          </select>
          <input type="date" className="form-control" style={{ width: 160 }} value={filters.from} onChange={(e) => set('from', e.target.value)} aria-label="From date" />
          <input type="date" className="form-control" style={{ width: 160 }} value={filters.to} onChange={(e) => set('to', e.target.value)} aria-label="To date" />
        </div>
        {dateError ? (
          <div className="p-3 text-danger" style={{ fontSize: '.88rem' }}>“From” must be before “To”.</div>
        ) : loading ? (
          <div className="p-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton mb-2" style={{ height: 40 }} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data.length ? (
          <EmptyState icon={ScrollText} title="No matching activity" message="Try different filters." />
        ) : (
          <div className="table-responsive">
            <table className="table iv-table table-hover">
              <thead><tr><th>When</th><th>Action</th><th>By</th><th>Details</th><th>IP</th></tr></thead>
              <tbody>
                {data.map((log) => (
                  <tr key={log._id}>
                    <td className="text-nowrap text-muted-iv">{formatDateTime(log.createdAt)}</td>
                    <td className="text-nowrap fw-semibold" style={{ fontSize: '.85rem' }}>{titleCase(log.action)}</td>
                    <td className="text-nowrap">
                      {log.actorRole === 'system' ? <Badge variant="info">System</Badge> : (
                        <span className="d-flex flex-column gap-1">
                          <span>{log.actor?.name || 'Deleted user'}</span>
                          {log.actorRole && <RoleBadge role={log.actorRole} />}
                        </span>
                      )}
                    </td>
                    <td className="text-muted-iv" style={{ fontSize: '.85rem', minWidth: 240 }}>{log.description || '—'}</td>
                    <td className="text-muted-iv text-nowrap" style={{ fontSize: '.8rem' }}>{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
      </Card>
    </>
  );
}
