import * as dashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function admin(_req, res) {
  sendSuccess(res, { message: 'Admin dashboard', data: await dashboardService.adminSummary() });
}

export async function trainer(req, res) {
  sendSuccess(res, { message: 'Trainer dashboard', data: await dashboardService.trainerSummary(req.user) });
}

export async function member(req, res) {
  sendSuccess(res, { message: 'Member dashboard', data: await dashboardService.memberSummary(req.user) });
}
