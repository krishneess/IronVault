import { useState } from 'react';
import { Dumbbell, Salad } from 'lucide-react';
import { Card, PageHeader } from '../../components/common/Display';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback';
import { ExerciseTable, MealList, PlanMeta } from '../../components/fitness/PlanContent';
import { memberService } from '../../services/fitnessService';
import useApiData from '../../hooks/useApiData';
import { MembershipRequired } from '../../components/membership/membershipUi';

const CONFIG = {
  workout: { key: 'workoutPlans', icon: Dumbbell, title: 'My workout plan', noun: 'workout plan', description: 'Exercises, sets and reps prescribed by your trainer.' },
  diet: { key: 'dietPlans', icon: Salad, title: 'My diet plan', noun: 'diet plan', description: 'Meals and daily calorie target set by your trainer.' },
};

/** Member view of assigned workout or diet plans (most recently updated first). */
export default function MemberPlans({ type }) {
  const cfg = CONFIG[type];
  const { data, loading, error, errorCode, reload } = useApiData(() => memberService.plans(), []);
  const [selectedId, setSelectedId] = useState(null);

  if (loading) return <PageLoader label={`Loading your ${cfg.noun}…`} />;
  if (errorCode === 'MEMBERSHIP_INACTIVE') {
    return (
      <>
        <PageHeader eyebrow="Member" title={cfg.title} description={cfg.description} />
        <MembershipRequired message={error} />
      </>
    );
  }
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;

  const plans = data[cfg.key];
  const plan = plans.find((p) => p._id === selectedId) || plans[0];

  return (
    <>
      <PageHeader eyebrow="Member" title={cfg.title} description={cfg.description} />
      {!plans.length ? (
        <Card>
          <EmptyState
            icon={cfg.icon}
            title={`No ${cfg.noun} assigned yet`}
            message={`Once your trainer assigns a ${cfg.noun}, it will appear here.`}
          />
        </Card>
      ) : (
        <>
          {plans.length > 1 && (
            <div className="d-flex flex-wrap gap-2 mb-3" role="tablist" aria-label={`Assigned ${cfg.noun}s`}>
              {plans.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  role="tab"
                  aria-selected={p._id === plan._id}
                  className={`btn btn-sm ${p._id === plan._id ? 'btn-gold' : 'btn-outline-gold'}`}
                  onClick={() => setSelectedId(p._id)}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
          <Card>
            <div className="eyebrow mb-1">{type === 'workout' ? 'Workout plan' : 'Diet plan'}</div>
            <h2 className="font-display h3 mb-2">{plan.title}</h2>
            <PlanMeta type={type} plan={plan} showTrainer />
            {plan.description && <p className="text-muted-iv mt-3 mb-0" style={{ whiteSpace: 'pre-line' }}>{plan.description}</p>}
            <hr className="divider-gold my-4" />
            {type === 'workout' ? <ExerciseTable exercises={plan.exercises} /> : <MealList meals={plan.meals} calorieTarget={plan.calorieTarget} />}
          </Card>
        </>
      )}
    </>
  );
}
