import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
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

export default router;
