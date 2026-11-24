import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function register(req, res) {
  const data = await authService.registerMember(req.body || {}, req);
  sendSuccess(res, { statusCode: 201, message: 'Registration successful. Welcome to IronVault!', data });
}

export async function login(req, res) {
  const data = await authService.login(req.body || {}, req);
  sendSuccess(res, { message: 'Login successful', data });
}

export async function me(req, res) {
  const user = await authService.getCurrentUser(req.user._id);
  sendSuccess(res, { message: 'Current user', data: { user } });
}

export async function changePassword(req, res) {
  await authService.changePassword(req.user._id, req.body || {}, req);
  sendSuccess(res, { message: 'Password updated successfully' });
}
