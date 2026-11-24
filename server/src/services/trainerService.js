import * as userRepository from '../repositories/userRepository.js';
import * as assignmentRepository from '../repositories/assignmentRepository.js';
import * as fitnessRecordRepository from '../repositories/fitnessRecordRepository.js';
import * as membershipRepository from '../repositories/membershipRepository.js';
import workoutPlanRepository from '../repositories/workoutPlanRepository.js';
import dietPlanRepository from '../repositories/dietPlanRepository.js';
import * as auditService from './auditService.js';
import * as fitnessRecordService from './fitnessRecordService.js';
import { ensureTrainerCoachesMember } from './assignmentService.js';
import { ROLES } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { validate, hasErrors, buildUpdate, PHONE_REGEX } from '../utils/validators.js';

const profileSchema = {
  name: { label: 'Name', minLength: 2, maxLength: 80 },
  phone: { label: 'Phone', pattern: PHONE_REGEX, message: 'Enter a valid phone number' },
  specialization: { label: 'Specialization', minLength: 2, maxLength: 80 },
  experience: { label: 'Experience', type: 'number', min: 0, max: 60 },
  bio: { label: 'Bio', maxLength: 1000 },
};

/** Trainer Management – a trainer's own profile and the members they coach. */
export async function updateOwnProfile(trainer, body = {}, req) {
  const errors = validate(body, profileSchema);
  for (const key of ['name', 'specialization']) {
    if (body[key] !== undefined && String(body[key]).trim() === '') errors[key] = `${key === 'name' ? 'Name' : 'Specialization'} is required`;
  }
  if (hasErrors(errors)) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const { set, unset } = buildUpdate(body, {
    strings: ['name', 'phone', 'specialization', 'bio'],
    numbers: ['experience'],
    optional: ['phone', 'bio', 'experience'],
  });
  const updated = await userRepository.updateById(ROLES.TRAINER, trainer._id, set, unset);
  await auditService.record({ actor: trainer, action: 'PROFILE_UPDATED', entity: 'User', entityId: trainer._id, description: 'Trainer updated their profile', req });
  return updated;
}

/** Members actively assigned to the trainer, with each member's latest fitness record. */
export async function listAssignedMembers(trainerId, { search } = {}) {
  const assignments = await assignmentRepository.findActiveByTrainer(trainerId);
  let rows = assignments.filter((a) => a.member).map((a) => ({ member: a.member, assignedDate: a.assignedDate }));

  if (search) {
    const term = String(search).toLowerCase().trim();
    rows = rows.filter(({ member }) =>
      [member.name, member.email, member.username].some((v) => v && v.toLowerCase().includes(term))
    );
  }

  const ids = rows.map((r) => r.member._id);
  const [latest, memberships] = await Promise.all([
    fitnessRecordRepository.findLatestForMembers(ids),
    membershipRepository.currentForMembers(ids),
  ]);
  const latestByMember = new Map(latest.map((l) => [String(l._id), l.record]));
  return rows.map((r) => {
    const m = memberships.get(String(r.member._id));
    return {
      ...r,
      latestRecord: latestByMember.get(String(r.member._id)) || null,
      membership: m ? { planType: m.planType, status: m.status, endDate: m.endDate } : null,
    };
  });
}

/** Full view of one assigned member: profile, plans from this trainer and progress summary. */
export async function getAssignedMember(trainerId, memberId) {
  await ensureTrainerCoachesMember(trainerId, memberId);
  const [member, assignment, workoutPlans, dietPlans, progress] = await Promise.all([
    userRepository.findMemberById(memberId),
    assignmentRepository.findActiveByMember(memberId),
    workoutPlanRepository.findByTrainerAssignedToMember(trainerId, memberId),
    dietPlanRepository.findByTrainerAssignedToMember(trainerId, memberId),
    fitnessRecordService.summary(memberId),
  ]);
  if (!member) throw ApiError.notFound('Member not found');
  return { member, assignedDate: assignment?.assignedDate, workoutPlans, dietPlans, progress };
}

export async function getMemberProgress(trainerId, memberId, query) {
  await ensureTrainerCoachesMember(trainerId, memberId);
  return fitnessRecordService.listForMember(memberId, query);
}
