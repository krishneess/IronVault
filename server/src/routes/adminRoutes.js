import { Router } from 'express';
import * as c from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../models/index.js';

/** /api/admin – member & trainer management, reports and audit records (admin only). */
const router = Router();
router.use(protect, authorize(ROLES.ADMIN));

router.get('/members', c.listMembers);
router.post('/members', c.createMember);
router.get('/members/:id', c.getMember);
router.patch('/members/:id', c.updateMember);
router.patch('/members/:id/status', c.setMemberStatus);

router.get('/trainers', c.listTrainers);
router.get('/trainers/options', c.trainerOptions);
router.post('/trainers', c.createTrainer);
router.get('/trainers/:id', c.getTrainer);
router.patch('/trainers/:id', c.updateTrainer);
router.patch('/trainers/:id/status', c.setTrainerStatus);

router.get('/reports/operational', c.operationalReport);
router.get('/audit-logs', c.auditLogs);

export default router;
