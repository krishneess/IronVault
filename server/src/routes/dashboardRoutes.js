import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../models/index.js';

const router = Router();

router.use(protect);
router.get('/admin', authorize(ROLES.ADMIN), dashboardController.admin);
router.get('/trainer', authorize(ROLES.TRAINER), dashboardController.trainer);
router.get('/member', authorize(ROLES.MEMBER), dashboardController.member);

export default router;
