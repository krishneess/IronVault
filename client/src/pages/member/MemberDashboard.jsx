import { CalendarDays, Ruler, Scale, Target } from 'lucide-react';
import { Avatar, Card, InfoRow, StatCard, StatusBadge } from '../../components/common/Display';
import { ErrorState, PageLoader } from '../../components/common/Feedback';
import { dashboardService } from '../../services/dashboardService';
import useApiData from '../../hooks/useApiData';
import { formatDate, titleCase } from '../../utils/format';

function bmi(height, weight) {
  if (!height || !weight) return null;
  const value = weight / (height / 100) ** 2;
  const band = value < 18.5 ? 'Underweight' : value < 25 ? 'Healthy range' : value < 30 ? 'Overweight' : 'Obese range';
  return { value: value.toFixed(1), band };
}

export default function MemberDashboard() {
  const { data, loading, error, reload } = useApiData(() => dashboardService.member(), []);

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;

  const member = data.profile;
  const bmiInfo = bmi(member.height, member.weight);

  return (
    <>
      <div className="welcome-banner mb-4">
        <div className="eyebrow">Member area</div>
        <h2 className="font-display h1 mt-2 mb-1">Welcome, {member.name.split(' ')[0]}</h2>
        <p className="text-muted-iv mb-0">
          {member.fitnessGoal ? <>Your goal: <span className="text-champagne">{member.fitnessGoal}</span></> : 'Your training journey lives here.'}
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard icon={Scale} label="Weight" value={member.weight ? `${member.weight} kg` : '—'} hint="From your profile" />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard icon={Ruler} label="Height" value={member.height ? `${member.height} cm` : '—'} hint="From your profile" />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard icon={Target} label="BMI" value={bmiInfo?.value ?? '—'} hint={bmiInfo?.band ?? 'Add height and weight'} />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard icon={CalendarDays} label="Member since" value={<span style={{ fontSize: '1.3rem' }}>{formatDate(member.joinDate)}</span>} />
        </div>
      </div>

      <Card title="Your profile">
        <div className="d-flex align-items-center gap-3 mb-3">
          <Avatar name={member.name} size="lg" />
          <div>
            <div className="h5 mb-1">{member.name}</div>
            <StatusBadge active={member.isActive} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <InfoRow label="Email" value={member.email} />
            <InfoRow label="Username" value={`@${member.username}`} />
            <InfoRow label="Phone" value={member.phone || '—'} />
          </div>
          <div className="col-md-6">
            <InfoRow label="Age" value={member.age ?? '—'} />
            <InfoRow label="Gender" value={member.gender ? titleCase(member.gender) : '—'} />
            <InfoRow label="Fitness goal" value={member.fitnessGoal || '—'} />
          </div>
        </div>
      </Card>
    </>
  );
}
