import * as assignmentService from '../services/assignmentService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function list(req, res) {
  const assignments = await assignmentService.listAssignments(req.query);
  sendSuccess(res, { message: 'Trainer assignments', data: assignments, meta: { total: assignments.length } });
}

export async function assign(req, res) {
  const assignment = await assignmentService.assignTrainer(req.user, req.body, req);
  sendSuccess(res, { statusCode: 201, message: 'Trainer assigned to member', data: assignment });
}

export async function end(req, res) {
  const assignment = await assignmentService.endAssignment(req.user, req.params.memberId, req);
  sendSuccess(res, { message: 'Trainer assignment ended', data: assignment });
}
