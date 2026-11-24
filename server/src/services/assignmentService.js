import * as assignmentRepository from '../repositories/assignmentRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import workoutPlanRepository from '../repositories/workoutPlanRepository.js';
import dietPlanRepository from '../repositories/dietPlanRepository.js';
import * as auditService from './auditService.js';
import { ASSIGNMENT_STATUS } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { isValidId } from '../utils/validators.js';

/**
 * Trainer Assignment – an Admin links a Trainer to a Member.
 * Ending or changing an assignment detaches the member from the previous trainer's plans,
 * so a trainer never keeps access to a member they no longer coach.
 */
async function detachFromTrainer(assignment) {
  if (!assignment) return;
  await Promise.all([
    workoutPlanRepository.removeMemberFromTrainerPlans(assignment.trainer, assignment.member),
    dietPlanRepository.removeMemberFromTrainerPlans(assignment.trainer, assignment.member),
  ]);
}

export async function assignTrainer(admin, { memberId, trainerId, notes } = {}, req) {
  const errors = {};
  if (!isValidId(memberId)) errors.memberId = 'Select a valid member';
  if (!isValidId(trainerId)) errors.trainerId = 'Select a valid trainer';
  if (notes && String(notes).length > 300) errors.notes = 'Notes must be at most 300 characters';
  if (Object.keys(errors).length) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const [member, trainer] = await Promise.all([
    userRepository.findMemberById(memberId),
    userRepository.findTrainerById(trainerId),
  ]);
  if (!member) throw ApiError.notFound('Member not found');
  if (!trainer) throw ApiError.notFound('Trainer not found');
  if (!member.isActive) throw ApiError.badRequest('Cannot assign a trainer to a deactivated member');
  if (!trainer.isActive) throw ApiError.badRequest('Cannot assign a deactivated trainer');

  const current = await assignmentRepository.findActiveByMember(memberId);
  if (current && String(current.trainer._id) === String(trainerId)) {
    throw ApiError.conflict(`${member.name} is already assigned to ${trainer.name}`);
  }
  if (current) {
    const ended = await assignmentRepository.endActiveForMember(memberId);
    await detachFromTrainer(ended);
  }

  const assignment = await assignmentRepository.create({
    member: memberId,
    trainer: trainerId,
    assignedBy: admin._id,
    notes: notes ? String(notes).trim() : '',
  });

  await auditService.record({
    actor: admin,
    action: current ? 'TRAINER_REASSIGNED' : 'TRAINER_ASSIGNED',
    entity: 'TrainerAssignment',
    entityId: assignment._id,
    description: `${trainer.name} assigned to ${member.name}${current ? ` (previously ${current.trainer.name})` : ''}`,
    req,
  });

  return assignment;
}

export async function endAssignment(admin, memberId, req) {
  if (!isValidId(memberId)) throw ApiError.badRequest('Invalid member id');
  const ended = await assignmentRepository.endActiveForMember(memberId);
  if (!ended) throw ApiError.notFound('This member has no active trainer assignment');
  await detachFromTrainer(ended);
  await auditService.record({
    actor: admin,
    action: 'TRAINER_UNASSIGNED',
    entity: 'TrainerAssignment',
    entityId: ended._id,
    description: 'Trainer assignment ended',
    req,
  });
  return ended;
}

export function listAssignments({ status, trainerId, memberId } = {}) {
  const filter = {};
  if (status && Object.values(ASSIGNMENT_STATUS).includes(status)) filter.status = status;
  if (isValidId(trainerId)) filter.trainer = trainerId;
  if (isValidId(memberId)) filter.member = memberId;
  return assignmentRepository.list(filter);
}

/** Ends a member's assignment if there is one (used when a member account is deactivated). */
export async function endAssignmentIfAny(admin, memberId, reason, req) {
  const ended = await assignmentRepository.endActiveForMember(memberId);
  if (!ended) return null;
  await detachFromTrainer(ended);
  await auditService.record({ actor: admin, action: 'TRAINER_UNASSIGNED', entity: 'TrainerAssignment', entityId: ended._id, description: reason, req });
  return ended;
}

/** Ends every assignment of a trainer (used when a trainer account is deactivated). */
export async function endAllForTrainer(admin, trainerId, reason, req) {
  const ended = await assignmentRepository.endAllForTrainer(trainerId);
  for (const a of ended) await detachFromTrainer(a);
  if (ended.length) {
    await auditService.record({
      actor: admin,
      action: 'TRAINER_UNASSIGNED',
      entity: 'User',
      entityId: trainerId,
      description: `${ended.length} member(s) unassigned: ${reason}`,
      req,
    });
  }
  return ended.length;
}

/** Throws unless the trainer actively coaches the member. Used by every trainer → member operation. */
export async function ensureTrainerCoachesMember(trainerId, memberId) {
  if (!isValidId(memberId)) throw ApiError.badRequest('Invalid member id');
  const assigned = await assignmentRepository.existsActive(trainerId, memberId);
  if (!assigned) throw ApiError.forbidden('This member is not assigned to you');
}
