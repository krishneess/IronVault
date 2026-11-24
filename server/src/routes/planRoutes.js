import { Router } from 'express';
import createPlanController from '../controllers/planControllerFactory.js';
import workoutPlanService from '../services/workoutPlanService.js';
import dietPlanService from '../services/dietPlanService.js';
import { protect, authorize } from '../middleware/auth.js';
import { requireActiveMembership } from '../middleware/membershipAccess.js';
import { ROLES } from '../models/index.js';

/**
 * Plan routes:
 *   list            trainer (own) / admin (all)
 *   view            trainer (own) / admin / member (if assigned)
 *   create/update/delete/assign/unassign   trainer (own plans only)
 */
function buildPlanRouter(service, label) {
  const controller = createPlanController(service, label);
  const router = Router();
  router.use(protect);
  router.get('/', authorize(ROLES.TRAINER, ROLES.ADMIN), controller.list);
  router.post('/', authorize(ROLES.TRAINER), controller.create);
  router.get('/:id', authorize(ROLES.TRAINER, ROLES.ADMIN, ROLES.MEMBER), requireActiveMembership, controller.get);
  router.put('/:id', authorize(ROLES.TRAINER), controller.update);
  router.delete('/:id', authorize(ROLES.TRAINER), controller.remove);
  router.post('/:id/assignments', authorize(ROLES.TRAINER), controller.assign);
  router.delete('/:id/assignments/:memberId', authorize(ROLES.TRAINER), controller.unassign);
  return router;
}

export const workoutPlanRoutes = buildPlanRouter(workoutPlanService, 'Workout plan');
export const dietPlanRoutes = buildPlanRouter(dietPlanService, 'Diet plan');
