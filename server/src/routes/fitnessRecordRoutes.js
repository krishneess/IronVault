import { Router } from 'express';
import * as fitnessRecordController from '../controllers/fitnessRecordController.js';
import { protect, authorize } from '../middleware/auth.js';
import { requireActiveMembership } from '../middleware/membershipAccess.js';
import { ROLES } from '../models/index.js';

/**
 * Members manage only their own records (trainers read them via /api/trainers/me/members/:id/progress).
 * Progress tracking requires an Active membership.
 */
const router = Router();

router.use(protect, authorize(ROLES.MEMBER), requireActiveMembership);
router.get('/', fitnessRecordController.list);
router.get('/summary', fitnessRecordController.summary);
router.post('/', fitnessRecordController.create);
router.put('/:id', fitnessRecordController.update);
router.delete('/:id', fitnessRecordController.remove);

export default router;
