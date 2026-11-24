import { DietPlan } from '../models/index.js';
import createPlanRepository from './planRepositoryFactory.js';

/** Diet Plan Repository – diet plan data access. */
const dietPlanRepository = createPlanRepository(DietPlan);
export default dietPlanRepository;
