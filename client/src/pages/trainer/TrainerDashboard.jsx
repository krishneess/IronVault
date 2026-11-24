import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Dumbbell, Plus, Salad, Users } from 'lucide-react';
import { Avatar, Card, StatCard } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import { dashboardService } from '../../services/dashboardService';
import useApiData from '../../hooks/useApiData';
import { formatDate } from '../../utils/format';

export default function TrainerDashboard() {
  const { data, loading, error, reload } = useApiData(() => dashboardService.trainer(), []);

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;

  const { profile: trainer, counts, members } = data;

  return (
    <>
      <div className="welcome-banner mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div className="eyebrow">Trainer workspace</div>
          <h2 className="font-display h1 mt-2 mb-1">Good to see you, {trainer.name.split(' ')[0]}</h2>
          <p className="text-muted-iv mb-0">{trainer.specialization} · {trainer.experience ?? 0} years coaching</p>
        </div>
        <div className="d-flex flex-wrap gap-2 position-relative" style={{ zIndex: 1 }}>
          <Link to="/trainer/workout-plans/new" className="btn btn-gold"><Plus size={17} /> Workout plan</Link>
          <Link to="/trainer/diet-plans/new" className="btn btn-outline-gold"><Plus size={17} /> Diet plan</Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard icon={Users} label="Assigned members" value={counts.assignedMembers} hint="Members you currently coach" />
        </div>
        <div className="col-md-4">
          <StatCard icon={Dumbbell} label="Workout plans" value={counts.workoutPlans} hint="Created by you" />
        </div>
        <div className="col-md-4">
          <StatCard icon={Salad} label="Diet plans" value={counts.dietPlans} hint="Created by you" />
        </div>
      </div>

      <Card
        title="Your members"
        subtitle="Latest logged progress"
        actions={counts.assignedMembers > 0 && <Link to="/trainer/members" className="btn btn-outline-gold btn-sm">View all <ArrowRight size={15} /></Link>}
      >
        {!members.length ? (
          <EmptyState icon={Users} title="No members assigned yet" message="An administrator will assign members to you." />
        ) : (
          members.map(({ member, latestRecord }) => (
            <Link key={member._id} to={`/trainer/members/${member._id}`} className="activity-item align-items-center text-decoration-none" style={{ color: 'inherit' }}>
              <Avatar name={member.name} />
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-semibold text-truncate">{member.name}</div>
                <div className="text-muted-iv text-truncate" style={{ fontSize: '.8rem' }}>{member.fitnessGoal || member.email}</div>
              </div>
              <div className="text-end flex-shrink-0" style={{ fontSize: '.82rem' }}>
                {latestRecord ? (
                  <>
                    <div className="fw-semibold">{latestRecord.weight} kg</div>
                    <div className="text-muted-iv">{formatDate(latestRecord.recordDate)}</div>
                  </>
                ) : (
                  <span className="text-muted-iv">No logs yet</span>
                )}
              </div>
              <ChevronRight size={18} className="text-muted-iv flex-shrink-0" />
            </Link>
          ))
        )}
      </Card>
    </>
  );
}
