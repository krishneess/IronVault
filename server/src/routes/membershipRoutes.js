import { Router } from 'express';
import * as c from '../controllers/membershipController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../models/index.js';

/** /api/membership-tiers – public catalogue, admin management. */
export const tierRoutes = Router();
tierRoutes.get('/', c.listTiers);
tierRoutes.get('/all', protect, authorize(ROLES.ADMIN), c.listAllTiers);
tierRoutes.post('/', protect, authorize(ROLES.ADMIN), c.createTier);
tierRoutes.put('/:id', protect, authorize(ROLES.ADMIN), c.updateTier);
tierRoutes.patch('/:id/status', protect, authorize(ROLES.ADMIN), c.setTierStatus);
tierRoutes.delete('/:id', protect, authorize(ROLES.ADMIN), c.deleteTier);

/** /api/memberships – member self-service + admin subscription management. */
export const membershipRoutes = Router();
membershipRoutes.use(protect);
membershipRoutes.get('/me', authorize(ROLES.MEMBER), c.myMembership);
membershipRoutes.post('/me', authorize(ROLES.MEMBER), c.selectPlan);
membershipRoutes.get('/summary', authorize(ROLES.ADMIN), c.statusSummary);
membershipRoutes.get('/', authorize(ROLES.ADMIN), c.list);
membershipRoutes.post('/', authorize(ROLES.ADMIN), c.createForMember);
membershipRoutes.get('/:id', authorize(ROLES.ADMIN), c.get);
membershipRoutes.post('/:id/transitions', authorize(ROLES.MEMBER, ROLES.ADMIN), c.transition);
