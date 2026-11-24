import dietPlanRepository from '../repositories/dietPlanRepository.js';
import createPlanService from './planServiceFactory.js';
import { validate, validateItems, pick } from '../utils/validators.js';

const MAX_MEALS = 20;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const planSchema = {
  title: { required: true, label: 'Title', minLength: 3, maxLength: 120 },
  description: { label: 'Description', maxLength: 2000 },
  calorieTarget: { required: true, label: 'Calorie target', type: 'number', min: 800, max: 10000 },
  goal: { required: true, label: 'Goal', minLength: 2, maxLength: 120 },
  meals: { required: true, label: 'Meals', type: 'array', minLength: 1 },
};

const mealSchema = {
  mealName: { required: true, label: 'Meal name', maxLength: 100 },
  time: { label: 'Time', pattern: TIME_REGEX, message: 'Use 24-hour HH:MM' },
  calories: { required: true, label: 'Calories', type: 'number', min: 0, max: 5000 },
  description: { label: 'Description', maxLength: 500 },
};

function validateDietPlan(body) {
  const errors = validate(body, planSchema);
  if (Array.isArray(body.meals)) {
    if (body.meals.length > MAX_MEALS) errors.meals = `A plan can have at most ${MAX_MEALS} meals`;
    Object.assign(errors, validateItems(body.meals, mealSchema, 'meals'));
  }

  const data = {
    ...pick(body, ['title', 'description', 'goal']),
    calorieTarget: Number(body.calorieTarget),
    meals: (body.meals || []).map((m) => ({
      mealName: String(m?.mealName ?? '').trim(),
      time: m?.time ? String(m.time).trim() : '',
      calories: Number(m?.calories),
      description: m?.description ? String(m.description).trim() : '',
    })),
  };
  for (const key of ['title', 'description', 'goal']) if (typeof data[key] === 'string') data[key] = data[key].trim();
  return { errors, data };
}

/** Diet Plan Service. */
const dietPlanService = createPlanService({
  repository: dietPlanRepository,
  label: 'Diet plan',
  entity: 'DietPlan',
  auditPrefix: 'DIET_PLAN',
  validate: validateDietPlan,
});

export default dietPlanService;
