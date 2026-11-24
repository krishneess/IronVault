import * as userRepository from '../repositories/userRepository.js';
import * as assignmentRepository from '../repositories/assignmentRepository.js';
import * as auditService from './auditService.js';
import workoutPlanService from './workoutPlanService.js';
import dietPlanService from './dietPlanService.js';
import { ROLES, GENDERS } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { validate, hasErrors, buildUpdate, PHONE_REGEX } from '../utils/validators.js';

const profileSchema = {
  name: { label: 'Name', minLength: 2, maxLength: 80 },
  phone: { label: 'Phone', pattern: PHONE_REGEX, message: 'Enter a valid phone number' },
  age: { label: 'Age', type: 'number', min: 10, max: 100 },
  gender: { label: 'Gender', enum: GENDERS },
  height: { label: 'Height', type: 'number', min: 50, max: 260 },
  weight: { label: 'Weight', type: 'number', min: 20, max: 400 },
  fitnessGoal: { label: 'Fitness goal', maxLength: 200 },
};

/** Member Management – a member's own profile, trainer and plans. */
export async function updateOwnProfile(member, body = {}, req) {
  const errors = validate(body, profileSchema);
  if (body.name !== undefined && String(body.name).trim() === '') errors.name = 'Name is required';
  if (hasErrors(errors)) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const { set, unset } = buildUpdate(body, {
    strings: ['name', 'phone', 'gender', 'fitnessGoal'],
    numbers: ['age', 'height', 'weight'],
    optional: ['phone', 'gender', 'fitnessGoal', 'age', 'height', 'weight'],
  });
  const updated = await userRepository.updateById(ROLES.MEMBER, member._id, set, unset);
  await auditService.record({ actor: member, action: 'PROFILE_UPDATED', entity: 'User', entityId: member._id, description: 'Member updated their profile', req });
  return updated;
}

/** The member's currently assigned trainer, or null. */
export async function getAssignedTrainer(memberId) {
  const assignment = await assignmentRepository.findActiveByMember(memberId);
  if (!assignment || !assignment.trainer) return null;
  return { trainer: assignment.trainer, assignedDate: assignment.assignedDate };
}

export async function getAssignedPlans(memberId) {
  const [workoutPlans, dietPlans] = await Promise.all([
    workoutPlanService.listForMember(memberId),
    dietPlanService.listForMember(memberId),
  ]);
  return { workoutPlans, dietPlans };
}
