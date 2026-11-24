import { Dumbbell, Salad } from 'lucide-react';
import { dietPlanService, workoutPlanService } from '../../services/fitnessService';

/** Per-type settings shared by the generic plan list / detail / editor pages. */
export const PLAN_TYPES = {
  workout: {
    type: 'workout',
    service: workoutPlanService,
    label: 'Workout plan',
    plural: 'Workout plans',
    icon: Dumbbell,
    basePath: '/trainer/workout-plans',
    itemsKey: 'exercises',
    itemLabel: 'exercise',
  },
  diet: {
    type: 'diet',
    service: dietPlanService,
    label: 'Diet plan',
    plural: 'Diet plans',
    icon: Salad,
    basePath: '/trainer/diet-plans',
    itemsKey: 'meals',
    itemLabel: 'meal',
  },
};
