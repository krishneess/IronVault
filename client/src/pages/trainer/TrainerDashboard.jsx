import { Award, BriefcaseBusiness, Mail, Phone } from 'lucide-react';
import { Avatar, Card, InfoRow, StatCard, StatusBadge } from '../../components/common/Display';
import { ErrorState, PageLoader } from '../../components/common/Feedback';
import { dashboardService } from '../../services/dashboardService';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';

export default function TrainerDashboard() {
  const { data, loading, error, reload } = useApiData(() => dashboardService.trainer(), []);

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;

  const trainer = data.profile;

  return (
    <>
      <div className="welcome-banner mb-4">
        <div className="eyebrow">Trainer workspace</div>
        <h2 className="font-display h1 mt-2 mb-1">Good to see you, {trainer.name.split(' ')[0]}</h2>
        <p className="text-muted-iv mb-0">Coach your members, build their plans and follow their progress.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-6">
          <StatCard icon={BriefcaseBusiness} label="Specialization" value={<span style={{ fontSize: '1.3rem' }}>{trainer.specialization}</span>} />
        </div>
        <div className="col-sm-6">
          <StatCard icon={Award} label="Experience" value={`${trainer.experience} yr${trainer.experience === 1 ? '' : 's'}`} hint="Professional coaching experience" />
        </div>
      </div>

      <Card title="Your trainer profile">
        <div className="d-flex align-items-center gap-3 mb-3">
          <Avatar name={trainer.name} size="lg" />
          <div>
            <div className="h5 mb-1">{trainer.name}</div>
            <StatusBadge active={trainer.isActive} />
          </div>
        </div>
        {trainer.bio && <p className="text-muted-iv">{trainer.bio}</p>}
        <InfoRow label={<><Mail size={14} className="me-2" />Email</>} value={trainer.email} />
        <InfoRow label={<><Phone size={14} className="me-2" />Phone</>} value={trainer.phone || '—'} />
        <InfoRow label="Username" value={`@${trainer.username}`} />
        <InfoRow label="Trainer since" value={formatDate(trainer.createdAt)} />
      </Card>
    </>
  );
}
