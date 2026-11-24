import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { Avatar, Card, PageHeader, StatusBadge } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import SearchInput from '../../components/common/SearchInput';
import { trainerService } from '../../services/fitnessService';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';
import { MembershipStatusBadge } from '../../components/membership/membershipUi';

export default function TrainerMembers() {
  const [search, setSearch] = useState('');
  const { data, meta, loading, error, reload } = useApiData(() => trainerService.members(search), [search]);
  const onSearch = useCallback((v) => setSearch(v), []);

  return (
    <>
      <PageHeader eyebrow="Trainer" title="My members" description="Members assigned to you by the administrator." />
      <Card noPadding>
        <div className="d-flex flex-wrap gap-2 align-items-center p-3 border-bottom filter-bar" style={{ borderColor: 'var(--iv-border-soft)' }}>
          <SearchInput value={search} onSearch={onSearch} placeholder="Search by name, email or username…" className="flex-grow-1" />
          {!loading && !error && <span className="text-muted-iv" style={{ fontSize: '.85rem' }}>{meta?.total ?? 0} member{meta?.total === 1 ? '' : 's'}</span>}
        </div>
        {loading ? (
          <div className="p-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton mb-2" style={{ height: 52 }} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data.length ? (
          <EmptyState
            icon={Users}
            title={search ? 'No members match your search' : 'No members assigned yet'}
            message={search ? 'Try another name or email.' : 'When an administrator assigns members to you, they will appear here.'}
          />
        ) : (
          <div className="table-responsive">
            <table className="table iv-table table-hover">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Membership</th>
                  <th>Goal</th>
                  <th className="text-end">Latest weight</th>
                  <th className="text-end">Body fat</th>
                  <th>Last log</th>
                  <th>Assigned</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map(({ member, assignedDate, latestRecord, membership }) => (
                  <tr key={member._id}>
                    <td>
                      <Link to={`/trainer/members/${member._id}`} className="d-flex align-items-center gap-2 text-decoration-none" style={{ color: 'var(--iv-text)' }}>
                        <Avatar name={member.name} />
                        <span>
                          <span className="d-block fw-semibold">{member.name}</span>
                          <span className="d-block text-muted-iv" style={{ fontSize: '.78rem' }}>{member.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td><MembershipStatusBadge status={membership?.status || 'none'} /></td>
                    <td className="text-muted-iv" style={{ maxWidth: 220 }}><span className="d-inline-block text-truncate" style={{ maxWidth: 220 }}>{member.fitnessGoal || '—'}</span></td>
                    <td className="text-end text-nowrap">{latestRecord?.weight ? `${latestRecord.weight} kg` : member.weight ? `${member.weight} kg` : '—'}</td>
                    <td className="text-end text-nowrap">{latestRecord?.bodyFatPercentage != null ? `${latestRecord.bodyFatPercentage}%` : '—'}</td>
                    <td className="text-nowrap text-muted-iv">{latestRecord ? formatDate(latestRecord.recordDate) : 'Never'}</td>
                    <td className="text-nowrap text-muted-iv">{formatDate(assignedDate)}</td>
                    <td className="text-end">
                      {!member.isActive && <StatusBadge active={false} />}
                      <Link to={`/trainer/members/${member._id}`} className="btn btn-ghost btn-icon btn-sm" aria-label={`Open ${member.name}`}><ChevronRight size={18} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
