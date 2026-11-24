import workoutPlanRepository from '../repositories/workoutPlanRepository.js';
import createPlanService from './planServiceFactory.js';
import { PLAN_LEVELS } from '../models/index.js';
import { validate, validateItems, pick } from '../utils/validators.js';

const MAX_EXERCISES = 50;

const planSchema = {
  title: { required: true, label: 'Title', minLength: 3, maxLength: 120 },
  description: { label: 'Description', maxLength: 2000 },
  level: { required: true, label: 'Level', enum: PLAN_LEVELS },
  durationInWeeks: { required: true, label: 'Duration', type: 'number', min: 1, max: 104 },
  exercises: { required: true, label: 'Exercises', type: 'array', minLength: 1 },
};

const exerciseSchema = {
  name: { required: true, label: 'Exercise name', maxLength: 100 },
  sets: { required: true, label: 'Sets', type: 'number', min: 1, max: 20 },
  repetitions: { required: true, label: 'Reps', type: 'number', min: 1, max: 200 },
  restTime: { label: 'Rest', type: 'number', min: 0, max: 900 },
  notes: { label: 'Notes', maxLength: 300 },
};

function validateWorkoutPlan(body) {
  const errors = validate(body, planSchema);
  if (Array.isArray(body.exercises)) {
    if (body.exercises.length > MAX_EXERCISES) errors.exercises = `A plan can have at most ${MAX_EXERCISES} exercises`;
    Object.assign(errors, validateItems(body.exercises, exerciseSchema, 'exercises'));
  }

  const data = {
    ...pick(body, ['title', 'description', 'level']),
    durationInWeeks: Number(body.durationInWeeks),
    exercises: (body.exercises || []).map((e) => ({
      name: String(e?.name ?? '').trim(),
      sets: Number(e?.sets),
      repetitions: Number(e?.repetitions),
      restTime: e?.restTime === '' || e?.restTime === undefined ? 60 : Number(e.restTime),
      notes: e?.notes ? String(e.notes).trim() : '',
    })),
  };
  if (typeof data.title === 'string') data.title = data.title.trim();
  if (typeof data.description === 'string') data.description = data.description.trim();
  return { errors, data };
}

/** Workout Plan Service. */
const workoutPlanService = createPlanService({
  repository: workoutPlanRepository,
  label: 'Workout plan',
  entity: 'WorkoutPlan',
  auditPrefix: 'WORKOUT_PLAN',
  validate: validateWorkoutPlan,
});

export default workoutPlanService;
