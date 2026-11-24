import * as adminUserService from '../services/adminUserService.js';
import * as reportService from '../services/reportService.js';
import * as auditService from '../services/auditService.js';
import { ROLES } from '../models/index.js';
import { sendSuccess } from '../utils/apiResponse.js';

// ---- Members
export async function listMembers(req, res) {
  const { items, meta } = await adminUserService.listMembers(req.query);
  sendSuccess(res, { message: 'Members', data: items, meta });
}
export async function getMember(req, res) {
  sendSuccess(res, { message: 'Member details', data: await adminUserService.getMember(req.params.id) });
}
export async function createMember(req, res) {
  const user = await adminUserService.createAccount(req.user, ROLES.MEMBER, req.body, req);
  sendSuccess(res, { statusCode: 201, message: 'Member account created', data: user });
}
export async function updateMember(req, res) {
  const user = await adminUserService.updateAccount(req.user, ROLES.MEMBER, req.params.id, req.body, req);
  sendSuccess(res, { message: 'Member account updated', data: user });
}
export async function setMemberStatus(req, res) {
  const data = await adminUserService.setAccountStatus(req.user, ROLES.MEMBER, req.params.id, req.body?.isActive, req);
  sendSuccess(res, { message: `Member account ${data.user.isActive ? 'activated' : 'deactivated'}`, data });
}

// ---- Trainers
export async function listTrainers(req, res) {
  const { items, meta } = await adminUserService.listTrainers(req.query);
  sendSuccess(res, { message: 'Trainers', data: items, meta });
}
export async function trainerOptions(_req, res) {
  sendSuccess(res, { message: 'Active trainers', data: await adminUserService.trainerOptions() });
}
export async function getTrainer(req, res) {
  sendSuccess(res, { message: 'Trainer details', data: await adminUserService.getTrainer(req.params.id) });
}
export async function createTrainer(req, res) {
  const user = await adminUserService.createAccount(req.user, ROLES.TRAINER, req.body, req);
  sendSuccess(res, { statusCode: 201, message: 'Trainer account created', data: user });
}
export async function updateTrainer(req, res) {
  const user = await adminUserService.updateAccount(req.user, ROLES.TRAINER, req.params.id, req.body, req);
  sendSuccess(res, { message: 'Trainer account updated', data: user });
}
export async function setTrainerStatus(req, res) {
  const data = await adminUserService.setAccountStatus(req.user, ROLES.TRAINER, req.params.id, req.body?.isActive, req);
  sendSuccess(res, { message: `Trainer account ${data.user.isActive ? 'activated' : 'deactivated'}`, data });
}

// ---- Reports & audit
export async function operationalReport(req, res) {
  sendSuccess(res, { message: 'Operational report', data: await reportService.operational(req.query) });
}
export async function auditLogs(req, res) {
  const { items, meta } = await auditService.search(req.query);
  sendSuccess(res, { message: 'Audit records', data: items, meta });
}
