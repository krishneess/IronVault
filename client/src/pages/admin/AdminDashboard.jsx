import { Activity, RefreshCw, ShieldCheck, UserCheck, UserCog, Users } from 'lucide-react';
import { Card, PageHeader, StatCard } from '../../components/common/Display';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import useApiData from '../../hooks/useApiData';
import { formatDateTime, timeAgo, titleCase } from '../../utils/format';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApiData(() => dashboardService.admin(), []);
  const counts = data?.counts || {};

  return (
    <>
      <div className="welcome-banner mb-4">
        <div className="eyebrow">Administrator console</div>
        <h2 className="font-display h1 mt-2 mb-1">Welcome, {user.name.split(' ')[0]}</h2>
        <p className="text-muted-iv mb-0">Oversee members, trainers and every activity across the club.</p>
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
              <StatCard icon={Users} label="Total members" value={counts.members ?? 0} hint={`${counts.activeMembers ?? 0} active accounts`} loading={loading} />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard icon={UserCheck} label="Active members" value={counts.activeMembers ?? 0} hint="Accounts able to sign in" loading={loading} />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard icon={UserCog} label="Trainers" value={counts.trainers ?? 0} hint={`${counts.activeTrainers ?? 0} active`} loading={loading} />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard icon={ShieldCheck} label="Administrators" value={counts.admins ?? 0} hint="Full system access" loading={loading} />
            </div>
          </div>

          <Card title="Recent system activity" subtitle="Latest audit records">
            {loading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className="skeleton mb-3" style={{ height: 44 }} />)
            ) : data?.recentActivity?.length ? (
              data.recentActivity.map((log) => (
                <div key={log._id} className="activity-item">
                  <span className="activity-dot"><Activity size={16} /></span>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="fw-semibold" style={{ fontSize: '.9rem' }}>{titleCase(log.action)}</div>
                    <div className="text-muted-iv text-truncate" style={{ fontSize: '.82rem' }}>
                      {log.description || '—'}
                      {log.actor?.name && <> · by {log.actor.name}</>}
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
        </>
      )}
    </>
  );
}
