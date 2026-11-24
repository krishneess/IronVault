import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Dumbbell, Flame, LockKeyhole, Percent, Plus, Ruler, Salad, Scale, UserRound } from 'lucide-react';
import { MembershipStatusBadge } from '../../components/membership/membershipUi';
import { STATUS_META } from '../../components/membership/membershipMeta';
import { Avatar, Card, StatCard } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import LineChart from '../../components/charts/LineChart';
import RecordFormModal from '../../components/fitness/RecordFormModal';
import { LevelBadge } from '../../components/fitness/PlanContent';
import { formatChange } from '../../components/fitness/metrics';
import { dashboardService } from '../../services/dashboardService';
import useApiData from '../../hooks/useApiData';
import { formatDate, pluralize } from '../../utils/format';

function bmi(height, weight) {
  if (!height || !weight) return null;
  const value = weight / (height / 100) ** 2;
  const band = value < 18.5 ? 'Underweight' : value < 25 ? 'Healthy range' : value < 30 ? 'Overweight' : 'Obese range';
  return { value: value.toFixed(1), band };
}

/** Dashboard when the membership is not Active: status + renewal prompt (interaction overview). */
function LockedDashboard({ data }) {
  const { profile: member, membership, validity } = data;
  const status = membership?.status || 'none';
  const cta =
    status === 'created' ? 'Submit application' : status === 'payment_pending' ? 'View payment status' : status === 'suspended' ? 'View membership' : 'Choose a plan';
  return (
    <>
      <div className="welcome-banner mb-4">
        <div className="eyebrow">Member area</div>
        <h2 className="font-display h1 mt-2 mb-1">Welcome, {member.name.split(' ')[0]}</h2>
        <p className="text-muted-iv mb-0">Your training features unlock once your membership is active.</p>
      </div>
      <div className="row g-4">
        <div className="col-lg-7">
          <Card title="Membership status" actions={<MembershipStatusBadge status={status} />}>
            <div className="d-flex gap-3 align-items-start">
              <span className="stat-icon flex-shrink-0"><LockKeyhole size={20} /></span>
              <div>
                <div className="h5 mb-1">{membership ? `${membership.planType} – ${STATUS_META[status].label}` : 'No membership yet'}</div>
                <p className="text-muted-iv mb-3" style={{ fontSize: '.9rem' }}>{STATUS_META[status].hint}</p>
                {status === 'suspended' && validity.holdEndsAt && (
                  <p className="text-muted-iv" style={{ fontSize: '.85rem' }}>Hold ends {formatDate(validity.holdEndsAt)}.</p>
                )}
                <Link to="/member/membership" className="btn btn-gold"><Crown size={17} /> {cta}</Link>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-lg-5">
          <Card title="Unlocked with an active membership">
            {[
              [Dumbbell, 'Personalised workout plan'],
              [Salad, 'Diet plan with calorie targets'],
              [Scale, 'Progress logging and history'],
              [UserRound, 'Your dedicated trainer'],
            ].map(([Icon, text]) => (
              <div key={text} className="info-row justify-content-start gap-3">
                <Icon size={16} className="text-gold" /> <span>{text}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

export default function MemberDashboard() {
  const { data, loading, error, reload } = useApiData(() => dashboardService.member(), []);
  const [logOpen, setLogOpen] = useState(false);

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (data.locked) return <LockedDashboard data={data} />;

  const { profile: member, membership, trainer, workoutPlan, dietPlan, planCounts, progress, recentRecords } = data;
  const latest = progress.latest;
  const currentWeight = latest?.weight ?? member.weight;
  const bmiInfo = bmi(member.height, currentWeight);

  return (
    <>
      <div className="welcome-banner mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div className="eyebrow">Member area</div>
          <h2 className="font-display h1 mt-2 mb-1">Welcome, {member.name.split(' ')[0]}</h2>
          <p className="text-muted-iv mb-0">
            {member.fitnessGoal ? <>Your goal: <span className="text-champagne">{member.fitnessGoal}</span></> : 'Your training journey lives here.'}
          </p>
        </div>
        <button type="button" className="btn btn-gold position-relative" style={{ zIndex: 1 }} onClick={() => setLogOpen(true)}>
          <Plus size={18} /> Log progress
        </button>
      </div>

      <Link to="/member/membership" className="iv-card d-flex flex-wrap align-items-center gap-3 px-4 py-3 mb-4 text-decoration-none" style={{ color: 'inherit' }}>
        <span className="stat-icon flex-shrink-0"><Crown size={18} /></span>
        <span className="fw-semibold">{membership.planType} membership</span>
        <MembershipStatusBadge status={membership.status} />
        <span className="text-muted-iv ms-auto" style={{ fontSize: '.85rem' }}>
          {membership.validity.daysRemaining} days left · valid until {formatDate(membership.endDate)}
        </span>
        <ArrowRight size={16} className="text-gold" />
      </Link>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            icon={Scale}
            label="Current weight"
            value={currentWeight ? `${currentWeight} kg` : '—'}
            hint={progress.change.weight !== undefined ? `${formatChange(progress.change.weight, 'kg')} since first log` : latest ? `Logged ${formatDate(latest.recordDate)}` : 'From your profile'}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            icon={Percent}
            label="Body fat"
            value={latest?.bodyFatPercentage != null ? `${latest.bodyFatPercentage}%` : '—'}
            hint={progress.change.bodyFatPercentage !== undefined ? `${formatChange(progress.change.bodyFatPercentage, '%')} since first log` : 'Log it with your progress'}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard icon={Ruler} label="BMI" value={bmiInfo?.value ?? '—'} hint={bmiInfo?.band ?? 'Add height and weight'} />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard icon={Flame} label="Records logged" value={progress.count} hint={latest ? `Last on ${formatDate(latest.recordDate)}` : 'No records yet'} />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <Card
            title="Weight trend"
            subtitle="Your most recent records"
            actions={<Link to="/member/progress" className="btn btn-outline-gold btn-sm">Full history <ArrowRight size={15} /></Link>}
          >
            {recentRecords.length ? (
              <LineChart points={recentRecords.map((r) => ({ date: r.recordDate, value: r.weight }))} unit="kg" height={230} label="Weight" />
            ) : (
              <EmptyState icon={Scale} title="No progress yet" message="Log your first weigh-in to see your trend here." />
            )}
          </Card>
        </div>
        <div className="col-lg-4">
          <Card title="My trainer" className="h-100" actions={trainer && <Link to="/member/trainer" className="btn btn-ghost btn-sm">View <ArrowRight size={15} /></Link>}>
            {trainer ? (
              <div className="d-flex align-items-center gap-3">
                <Avatar name={trainer.trainer.name} />
                <div style={{ minWidth: 0 }}>
                  <div className="fw-bold">{trainer.trainer.name}</div>
                  <div className="text-champagne" style={{ fontSize: '.85rem' }}>{trainer.trainer.specialization}</div>
                  <div className="text-muted-iv" style={{ fontSize: '.8rem' }}>Since {formatDate(trainer.assignedDate)}</div>
                </div>
              </div>
            ) : (
              <EmptyState icon={UserRound} title="Not assigned yet" message="An administrator will match you with a trainer." />
            )}
          </Card>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <Card
            title="Current workout plan"
            subtitle={planCounts.workout > 1 ? `${planCounts.workout} plans assigned` : undefined}
            className="h-100"
            actions={workoutPlan && <Link to="/member/workouts" className="btn btn-ghost btn-sm">Open <ArrowRight size={15} /></Link>}
          >
            {workoutPlan ? (
              <>
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div className="h5 mb-0">{workoutPlan.title}</div>
                  <LevelBadge level={workoutPlan.level} />
                </div>
                <div className="text-muted-iv mb-3" style={{ fontSize: '.85rem' }}>
                  {pluralize(workoutPlan.durationInWeeks, "week")} · {pluralize(workoutPlan.exercises.length, "exercise")} · by {workoutPlan.trainer?.name}
                </div>
                {workoutPlan.exercises.slice(0, 4).map((ex) => (
                  <div key={ex._id} className="info-row">
                    <span className="label">{ex.name}</span>
                    <span className="value">{ex.sets} × {ex.repetitions}</span>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState icon={Dumbbell} title="No workout plan yet" message="Your trainer will assign one soon." />
            )}
          </Card>
        </div>
        <div className="col-lg-6">
          <Card
            title="Current diet plan"
            subtitle={planCounts.diet > 1 ? `${planCounts.diet} plans assigned` : undefined}
            className="h-100"
            actions={dietPlan && <Link to="/member/diet" className="btn btn-ghost btn-sm">Open <ArrowRight size={15} /></Link>}
          >
            {dietPlan ? (
              <>
                <div className="h5 mb-1">{dietPlan.title}</div>
                <div className="text-muted-iv mb-3" style={{ fontSize: '.85rem' }}>
                  {dietPlan.goal} · {dietPlan.calorieTarget} kcal/day · by {dietPlan.trainer?.name}
                </div>
                {dietPlan.meals.slice(0, 4).map((m) => (
                  <div key={m._id} className="info-row">
                    <span className="label">{m.time ? `${m.time} · ` : ''}{m.mealName}</span>
                    <span className="value">{m.calories} kcal</span>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState icon={Salad} title="No diet plan yet" message="Your trainer will assign one soon." />
            )}
          </Card>
        </div>
      </div>

      <RecordFormModal open={logOpen} record={null} onClose={() => setLogOpen(false)} onSaved={reload} />
    </>
  );
}
