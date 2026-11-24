import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CreditCard, Crown, Dumbbell, RefreshCw, UserCheck, UserCog, Users } from 'lucide-react';
import { Card, PageHeader, StatCard } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import BarChart from '../../components/charts/BarChart';
import { STATUS_META, STATUS_ORDER } from '../../components/membership/membershipMeta';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import useApiData from '../../hooks/useApiData';
import { formatDate, formatDateTime, timeAgo, titleCase } from '../../utils/format';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApiData(() => dashboardService.admin(), []);
  const counts = data?.counts || {};
  const ms = data?.memberships || {};

  return (
    <>
      <div className="welcome-banner mb-4">
        <div className="eyebrow">Administrator console</div>
        <h2 className="font-display h1 mt-2 mb-1">Welcome, {user.name.split(' ')[0]}</h2>
        <p className="text-muted-iv mb-0">Oversee members, trainers, memberships and every activity across the club.</p>
      </div>

      <PageHeader
        title="Club overview"
        description="Live figures from the IronVault repository."
        actions={
          <button type="button" className="btn btn-outline-gold btn-sm" onClick={reload} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      {error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3">
              <StatCard icon={Users} label="Members" value={counts.members ?? 0} hint={`${counts.activeMembers ?? 0} active accounts`} loading={loading} />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard icon={Crown} label="Active memberships" value={ms.active ?? 0} hint={`${ms.suspended ?? 0} on hold`} loading={loading} />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard icon={CreditCard} label="Awaiting payment" value={ms.payment_pending ?? 0} hint={`${ms.created ?? 0} not yet submitted`} loading={loading} />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard icon={UserCog} label="Trainers" value={counts.trainers ?? 0} hint={`${counts.activeTrainers ?? 0} active · ${counts.assignedMembers ?? 0} members coached`} loading={loading} />
            </div>
          </div>

          {!loading && (ms.payment_pending > 0 || counts.activeMembers > counts.assignedMembers) && (
            <div className="d-flex flex-wrap gap-2 mb-4">
              {ms.payment_pending > 0 && (
                <Link to="/admin/memberships" className="btn btn-outline-gold btn-sm"><CreditCard size={15} /> Verify {ms.payment_pending} pending payment{ms.payment_pending === 1 ? '' : 's'}</Link>
              )}
              {counts.activeMembers > counts.assignedMembers && (
                <Link to="/admin/allocation" className="btn btn-outline-gold btn-sm"><UserCheck size={15} /> {counts.activeMembers - counts.assignedMembers} member(s) need a trainer</Link>
              )}
            </div>
          )}

          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <Card title="Memberships by status" className="h-100" actions={<Link to="/admin/memberships" className="btn btn-ghost btn-sm">Manage <ArrowRight size={15} /></Link>}>
                {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
                  <BarChart data={STATUS_ORDER.map((s) => ({ label: STATUS_META[s].label, value: ms[s] ?? 0 }))} emptyText="No memberships yet" />
                )}
              </Card>
            </div>
            <div className="col-lg-7">
              <Card title="Expiring in the next 14 days" className="h-100" noPadding>
                {loading ? (
                  <div className="p-3"><div className="skeleton" style={{ height: 160 }} /></div>
                ) : data.expiringSoon.length ? (
                  <div className="table-responsive">
                    <table className="table iv-table">
                      <thead><tr><th>Member</th><th>Plan</th><th className="text-end">Ends</th></tr></thead>
                      <tbody>
                        {data.expiringSoon.map((m) => (
                          <tr key={m._id}>
                            <td>{m.member ? <Link to={`/admin/members/${m.member._id}`} className="fw-semibold text-decoration-none" style={{ color: 'var(--iv-text)' }}>{m.member.name}</Link> : '—'}</td>
                            <td className="text-muted-iv">{m.planType}</td>
                            <td className="text-end text-nowrap">{formatDate(m.endDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState icon={Crown} title="Nothing expiring soon" message="No active membership ends in the next two weeks." />
                )}
              </Card>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-4">
              <Card title="Training content" className="h-100">
                <StatCard icon={Dumbbell} label="Workout / diet plans" value={loading ? '…' : `${counts.workoutPlans ?? 0} / ${counts.dietPlans ?? 0}`} hint="Created by trainers" />
                <div className="mt-3"><StatCard icon={Activity} label="Progress records" value={loading ? '…' : counts.fitnessRecords ?? 0} hint="Logged by members" /></div>
              </Card>
            </div>
            <div className="col-lg-8">
              <Card title="Recent system activity" subtitle="Latest audit records" actions={<Link to="/admin/activity" className="btn btn-ghost btn-sm">View all <ArrowRight size={15} /></Link>}>
                {loading ? (
                  [1, 2, 3, 4].map((i) => <div key={i} className="skeleton mb-3" style={{ height: 44 }} />)
                ) : data.recentActivity.length ? (
                  data.recentActivity.map((log) => (
                    <div key={log._id} className="activity-item">
                      <span className="activity-dot"><Activity size={16} /></span>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-semibold" style={{ fontSize: '.9rem' }}>{titleCase(log.action)}</div>
                        <div className="text-muted-iv text-truncate" style={{ fontSize: '.82rem' }}>
                          {log.description || '—'}
                          {log.actor?.name ? <> · by {log.actor.name}</> : log.actorRole === 'system' ? ' · system' : null}
                        </div>
                      </div>
                      <div className="text-end text-muted-iv flex-shrink-0" style={{ fontSize: '.76rem' }} title={formatDateTime(log.createdAt)}>
                        {timeAgo(log.createdAt)}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={Activity} title="No activity yet" message="Sign-ins, registrations and account changes will appear here." />
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
