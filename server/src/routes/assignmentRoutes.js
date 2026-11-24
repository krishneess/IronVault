import { Router } from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../models/index.js';

/** Trainer allocation – admin only. */
const router = Router();

router.use(protect, authorize(ROLES.ADMIN));
router.get('/', assignmentController.list);
router.post('/', assignmentController.assign);
router.delete('/member/:memberId', assignmentController.end);

export default router;
