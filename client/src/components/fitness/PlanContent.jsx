import { CalendarRange, Clock, Flame, Target, UserRound } from 'lucide-react';
import { Badge } from '../common/Display';
import { LEVEL_VARIANT } from './metrics';
import { formatDate, titleCase } from '../../utils/format';

export function LevelBadge({ level }) {
  return <Badge variant={LEVEL_VARIANT[level] || 'muted'}>{titleCase(level)}</Badge>;
}

function formatRest(seconds) {
  if (seconds === undefined || seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m} min`;
}

export function ExerciseTable({ exercises = [] }) {
  return (
    <div className="table-responsive">
      <table className="table iv-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Exercise</th>
            <th className="text-center">Sets</th>
            <th className="text-center">Reps</th>
            <th className="text-center">Rest</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex, i) => (
            <tr key={ex._id || i}>
              <td className="text-gold fw-bold">{i + 1}</td>
              <td className="fw-semibold">{ex.name}</td>
              <td className="text-center">{ex.sets}</td>
              <td className="text-center">{ex.repetitions}</td>
              <td className="text-center text-nowrap">{formatRest(ex.restTime)}</td>
              <td className="text-muted-iv">{ex.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MealList({ meals = [], calorieTarget }) {
  const total = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
  const pct = calorieTarget ? Math.min(100, Math.round((total / calorieTarget) * 100)) : 0;
  const sorted = [...meals].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  return (
    <>
      {calorieTarget ? (
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1" style={{ fontSize: '.85rem' }}>
            <span className="text-muted-iv">Planned meals vs daily target</span>
            <span className="fw-semibold">
              {total} / {calorieTarget} kcal
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: 'var(--iv-surface-3)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--iv-gold-gradient)' }} />
          </div>
        </div>
      ) : null}
      {sorted.map((meal, i) => (
        <div key={meal._id || i} className="activity-item">
          <span className="activity-dot"><Clock size={15} /></span>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="d-flex justify-content-between gap-2">
              <span className="fw-semibold">{meal.mealName}</span>
              <span className="text-gold fw-semibold text-nowrap">{meal.calories} kcal</span>
            </div>
            <div className="text-muted-iv" style={{ fontSize: '.82rem' }}>
              {meal.time ? `${meal.time} · ` : ''}
              {meal.description || 'No description'}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Compact facts row shown at the top of a plan. */
export function PlanMeta({ type, plan, showTrainer = false }) {
  const items =
    type === 'workout'
      ? [
          { icon: Target, text: <LevelBadge level={plan.level} /> },
          { icon: CalendarRange, text: `${plan.durationInWeeks} week${plan.durationInWeeks === 1 ? '' : 's'}` },
          { icon: Flame, text: plural(plan.exercises?.length || 0, 'exercise') },
        ]
      : [
          { icon: Target, text: plan.goal },
          { icon: Flame, text: `${plan.calorieTarget} kcal / day` },
          { icon: Clock, text: plural(plan.meals?.length || 0, 'meal') },
        ];
  if (showTrainer && plan.trainer?.name) items.push({ icon: UserRound, text: `By ${plan.trainer.name}` });
  items.push({ icon: CalendarRange, text: `Updated ${formatDate(plan.updatedAt || plan.createdDate)}` });

  return (
    <div className="d-flex flex-wrap gap-3 text-muted-iv" style={{ fontSize: '.85rem' }}>
      {items.map(({ icon: Icon, text }, i) => (
        <span key={i} className="d-inline-flex align-items-center gap-2">
          <Icon size={15} className="text-gold" /> {text}
        </span>
      ))}
    </div>
  );
}
