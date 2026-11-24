import * as membershipService from '../services/membershipService.js';
import * as tierService from '../services/membershipTierService.js';
import { sendSuccess } from '../utils/apiResponse.js';

// ---- Tiers
export async function listTiers(_req, res) {
  sendSuccess(res, { message: 'Membership tiers', data: await tierService.list() });
}
export async function listAllTiers(_req, res) {
  sendSuccess(res, { message: 'All membership tiers', data: await tierService.list({ includeInactive: true }) });
}
export async function createTier(req, res) {
  sendSuccess(res, { statusCode: 201, message: 'Membership tier created', data: await tierService.create(req.user, req.body, req) });
}
export async function updateTier(req, res) {
  sendSuccess(res, { message: 'Membership tier updated', data: await tierService.update(req.user, req.params.id, req.body, req) });
}
export async function setTierStatus(req, res) {
  const tier = await tierService.setActive(req.user, req.params.id, req.body?.isActive, req);
  sendSuccess(res, { message: `Membership tier ${tier.isActive ? 'activated' : 'deactivated'}`, data: tier });
}
export async function deleteTier(req, res) {
  await tierService.remove(req.user, req.params.id, req);
  sendSuccess(res, { message: 'Membership tier deleted' });
}

// ---- Member self-service
export async function myMembership(req, res) {
  sendSuccess(res, { message: 'Membership details', data: await membershipService.getMemberOverview(req.user._id) });
}
export async function selectPlan(req, res) {
  const membership = await membershipService.create(req.user, String(req.user._id), req.body?.tierId, req);
  sendSuccess(res, { statusCode: 201, message: 'Membership plan selected', data: membership });
}

// ---- Shared transition endpoint (member: own membership; admin: any)
export async function transition(req, res) {
  const { action, ...rest } = req.body || {};
  const membership = await membershipService.transition(req.user, req.params.id, action, rest, req);
  sendSuccess(res, { message: 'Membership updated', data: membership });
}

// ---- Admin subscription management
export async function list(req, res) {
  const { items, meta } = await membershipService.list(req.query);
  sendSuccess(res, { message: 'Memberships', data: items, meta });
}
export async function get(req, res) {
  sendSuccess(res, { message: 'Membership', data: await membershipService.getById(req.params.id) });
}
export async function createForMember(req, res) {
  const membership = await membershipService.create(req.user, req.body?.memberId, req.body?.tierId, req);
  sendSuccess(res, { statusCode: 201, message: 'Membership created', data: membership });
}
export async function statusSummary(_req, res) {
  const [counts, expiring] = await Promise.all([membershipService.statusCounts(), membershipService.expiringSoon(14, 10)]);
  sendSuccess(res, { message: 'Membership summary', data: { counts, expiringSoon: expiring } });
}
