import * as fitnessRecordRepository from '../repositories/fitnessRecordRepository.js';
import * as auditService from './auditService.js';
import ApiError from '../utils/ApiError.js';
import { validate, isValidId, hasErrors } from '../utils/validators.js';

export const MEASUREMENTS = ['bodyFatPercentage', 'chest', 'waist', 'arms', 'legs'];

const recordSchema = {
  weight: { required: true, label: 'Weight', type: 'number', min: 20, max: 400 },
  bodyFatPercentage: { label: 'Body fat %', type: 'number', min: 2, max: 70 },
  chest: { label: 'Chest', type: 'number', min: 30, max: 250 },
  waist: { label: 'Waist', type: 'number', min: 30, max: 250 },
  arms: { label: 'Arms', type: 'number', min: 10, max: 100 },
  legs: { label: 'Legs', type: 'number', min: 20, max: 150 },
  recordDate: { required: true, label: 'Date', type: 'date' },
  notes: { label: 'Notes', maxLength: 500 },
};

const blank = (v) => v === undefined || v === null || v === '';

/** Validates a record; returns { set, unset } so clearing an optional measurement removes it. */
function validateRecord(body = {}) {
  const errors = validate(body, recordSchema);
  if (!errors.recordDate) {
    // Allow up to the end of tomorrow to absorb client time-zone differences.
    const limit = new Date();
    limit.setDate(limit.getDate() + 1);
    limit.setHours(23, 59, 59, 999);
    if (new Date(body.recordDate) > limit) errors.recordDate = 'Date cannot be in the future';
  }
  if (hasErrors(errors)) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const set = { weight: Number(body.weight), recordDate: new Date(body.recordDate), notes: body.notes ? String(body.notes).trim() : '' };
  const unset = [];
  for (const key of MEASUREMENTS) {
    if (blank(body[key])) unset.push(key);
    else set[key] = Number(body[key]);
  }
  return { set, unset };
}

function round(n) {
  return Math.round(n * 10) / 10;
}

/** Fitness Record Service – members log and manage their own progress. */
export function listForMember(memberId, { from, to } = {}) {
  return fitnessRecordRepository.findByMember(memberId, {
    from: from && !Number.isNaN(new Date(from).getTime()) ? from : undefined,
    to: to && !Number.isNaN(new Date(to).getTime()) ? to : undefined,
  });
}

export async function addRecord(member, body, req) {
  const { set } = validateRecord(body);
  const record = await fitnessRecordRepository.create({ ...set, member: member._id });
  await auditService.record({
    actor: member,
    action: 'FITNESS_RECORD_ADDED',
    entity: 'FitnessRecord',
    entityId: record._id,
    description: `Progress logged: ${record.weight} kg`,
    req,
  });
  return record;
}

export async function updateRecord(member, id, body, req) {
  if (!isValidId(id)) throw ApiError.badRequest('Invalid record id');
  const { set, unset } = validateRecord(body);
  const update = { $set: set };
  if (unset.length) update.$unset = Object.fromEntries(unset.map((k) => [k, 1]));
  const record = await fitnessRecordRepository.updateForMember(id, member._id, update);
  if (!record) throw ApiError.notFound('Fitness record not found');
  await auditService.record({ actor: member, action: 'FITNESS_RECORD_UPDATED', entity: 'FitnessRecord', entityId: record._id, req });
  return record;
}

export async function deleteRecord(member, id, req) {
  if (!isValidId(id)) throw ApiError.badRequest('Invalid record id');
  const record = await fitnessRecordRepository.deleteForMember(id, member._id);
  if (!record) throw ApiError.notFound('Fitness record not found');
  await auditService.record({ actor: member, action: 'FITNESS_RECORD_DELETED', entity: 'FitnessRecord', entityId: record._id, req });
}

/** Latest values and change since the first record. */
export async function summary(memberId) {
  const [latest, first, count] = await Promise.all([
    fitnessRecordRepository.findLatest(memberId),
    fitnessRecordRepository.findFirst(memberId),
    fitnessRecordRepository.countByMember(memberId),
  ]);
  const change = {};
  if (latest && first && count > 1) {
    for (const key of ['weight', ...MEASUREMENTS]) {
      if (latest[key] !== undefined && first[key] !== undefined) change[key] = round(latest[key] - first[key]);
    }
  }
  return { count, latest, first, change };
}
