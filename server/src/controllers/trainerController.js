import * as trainerService from '../services/trainerService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export function getProfile(req, res) {
  sendSuccess(res, { message: 'Trainer profile', data: { profile: req.user } });
}

export async function updateProfile(req, res) {
  const profile = await trainerService.updateOwnProfile(req.user, req.body, req);
  sendSuccess(res, { message: 'Profile updated successfully', data: { profile } });
}

export async function listMembers(req, res) {
  const members = await trainerService.listAssignedMembers(req.user._id, { search: req.query.search });
  sendSuccess(res, { message: 'Assigned members', data: members, meta: { total: members.length } });
}

export async function getMember(req, res) {
  const data = await trainerService.getAssignedMember(req.user._id, req.params.memberId);
  sendSuccess(res, { message: 'Member details', data });
}

export async function getMemberProgress(req, res) {
  const records = await trainerService.getMemberProgress(req.user._id, req.params.memberId, req.query);
  sendSuccess(res, { message: 'Member progress history', data: records, meta: { total: records.length } });
}
