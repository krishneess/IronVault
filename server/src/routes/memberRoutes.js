import { Router } from 'express';
import * as memberController from '../controllers/memberController.js';
import { protect, authorize } from '../middleware/auth.js';
import { requireActiveMembership } from '../middleware/membershipAccess.js';
import { ROLES } from '../models/index.js';

const router = Router();

router.use(protect, authorize(ROLES.MEMBER));
router.get('/me', memberController.getProfile);
router.patch('/me', memberController.updateProfile);
// Training features require a valid (Active) membership.
router.get('/me/trainer', requireActiveMembership, memberController.getTrainer);
router.get('/me/plans', requireActiveMembership, memberController.getPlans);

export default router;
