import * as fitnessRecordService from '../services/fitnessRecordService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function list(req, res) {
  const records = await fitnessRecordService.listForMember(req.user._id, req.query);
  sendSuccess(res, { message: 'Fitness records', data: records, meta: { total: records.length } });
}

export async function summary(req, res) {
  sendSuccess(res, { message: 'Progress summary', data: await fitnessRecordService.summary(req.user._id) });
}

export async function create(req, res) {
  const record = await fitnessRecordService.addRecord(req.user, req.body, req);
  sendSuccess(res, { statusCode: 201, message: 'Progress logged successfully', data: record });
}

export async function update(req, res) {
  const record = await fitnessRecordService.updateRecord(req.user, req.params.id, req.body, req);
  sendSuccess(res, { message: 'Fitness record updated', data: record });
}

export async function remove(req, res) {
  await fitnessRecordService.deleteRecord(req.user, req.params.id, req);
  sendSuccess(res, { message: 'Fitness record deleted' });
}
