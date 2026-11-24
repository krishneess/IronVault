import * as memberService from '../services/memberService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export function getProfile(req, res) {
  sendSuccess(res, { message: 'Member profile', data: { profile: req.user } });
}

export async function updateProfile(req, res) {
  const profile = await memberService.updateOwnProfile(req.user, req.body, req);
  sendSuccess(res, { message: 'Profile updated successfully', data: { profile } });
}

export async function getTrainer(req, res) {
  const data = await memberService.getAssignedTrainer(req.user._id);
  sendSuccess(res, { message: data ? 'Assigned trainer' : 'No trainer assigned yet', data });
}

export async function getPlans(req, res) {
  const data = await memberService.getAssignedPlans(req.user._id);
  sendSuccess(res, { message: 'Assigned plans', data });
}
