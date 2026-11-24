import { WorkoutPlan } from '../models/index.js';
import createPlanRepository from './planRepositoryFactory.js';

/** Workout Plan Repository – workout plan data access. */
const workoutPlanRepository = createPlanRepository(WorkoutPlan);
export default workoutPlanRepository;
