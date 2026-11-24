import { Router } from 'express';
import * as trainerController from '../controllers/trainerController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../models/index.js';

const router = Router();

router.use(protect, authorize(ROLES.TRAINER));
router.get('/me', trainerController.getProfile);
router.patch('/me', trainerController.updateProfile);
router.get('/me/members', trainerController.listMembers);
router.get('/me/members/:memberId', trainerController.getMember);
router.get('/me/members/:memberId/progress', trainerController.getMemberProgress);

export default router;
