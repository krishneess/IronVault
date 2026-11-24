import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import memberRoutes from './memberRoutes.js';
import trainerRoutes from './trainerRoutes.js';
import { workoutPlanRoutes, dietPlanRoutes } from './planRoutes.js';
import fitnessRecordRoutes from './fitnessRecordRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import { tierRoutes, membershipRoutes } from './membershipRoutes.js';
import adminRoutes from './adminRoutes.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** Request Router – mounts every module under /api. */
const router = Router();

router.get('/health', (_req, res) =>
  sendSuccess(res, {
    message: 'IronVault API is running',
    data: { database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', time: new Date() },
  })
);

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/members', memberRoutes);
router.use('/trainers', trainerRoutes);
router.use('/workout-plans', workoutPlanRoutes);
router.use('/diet-plans', dietPlanRoutes);
router.use('/fitness-records', fitnessRecordRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/membership-tiers', tierRoutes);
router.use('/memberships', membershipRoutes);
router.use('/admin', adminRoutes);

export default router;
