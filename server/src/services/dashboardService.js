import * as userRepository from '../repositories/userRepository.js';
import * as assignmentRepository from '../repositories/assignmentRepository.js';
import * as fitnessRecordRepository from '../repositories/fitnessRecordRepository.js';
import workoutPlanRepository from '../repositories/workoutPlanRepository.js';
import dietPlanRepository from '../repositories/dietPlanRepository.js';
import * as auditService from './auditService.js';
import * as memberService from './memberService.js';
import * as trainerService from './trainerService.js';
import * as fitnessRecordService from './fitnessRecordService.js';
import * as membershipService from './membershipService.js';
import { ROLES } from '../models/index.js';

/** Role-specific dashboard summaries. */
export async function adminSummary() {
  const [members, activeMembers, trainers, activeTrainers, admins, workoutPlans, dietPlans, fitnessRecords, assignedMembers, membershipCounts, expiringSoon, recentActivity] =
    await Promise.all([
      userRepository.countByRole(ROLES.MEMBER),
      userRepository.countByRole(ROLES.MEMBER, { isActive: true }),
      userRepository.countByRole(ROLES.TRAINER),
      userRepository.countByRole(ROLES.TRAINER, { isActive: true }),
      userRepository.countByRole(ROLES.ADMIN),
      workoutPlanRepository.count(),
      dietPlanRepository.count(),
      fitnessRecordRepository.countAll(),
      assignmentRepository.activeMemberIds().then((ids) => ids.length),
      membershipService.statusCounts(),
      membershipService.expiringSoon(14, 6),
      auditService.recent(8),
    ]);
  return {
    counts: { members, activeMembers, trainers, activeTrainers, admins, workoutPlans, dietPlans, fitnessRecords, assignedMembers },
    memberships: membershipCounts,
    expiringSoon,
    recentActivity,
  };
}

export async function trainerSummary(trainer) {
  const [assignedMembers, workoutPlans, dietPlans, members] = await Promise.all([
    assignmentRepository.countActiveByTrainer(trainer._id),
    workoutPlanRepository.countByTrainer(trainer._id),
    dietPlanRepository.countByTrainer(trainer._id),
    trainerService.listAssignedMembers(trainer._id),
  ]);
  return {
    profile: trainer,
    counts: { assignedMembers, workoutPlans, dietPlans },
    members: members.slice(0, 6),
  };
}

/**
 * Member dashboard. Membership status is always returned; training data (trainer, plans,
 * progress) only when the membership is valid – matching the interaction overview.
 */
export async function memberSummary(member) {
  const overview = await membershipService.getMemberOverview(member._id);
  const base = { profile: member, membership: overview.current, validity: overview.validity };
  if (!overview.validity.isValid) return { ...base, locked: true };

  const [trainer, plans, progress, recentRecords] = await Promise.all([
    memberService.getAssignedTrainer(member._id),
    memberService.getAssignedPlans(member._id),
    fitnessRecordService.summary(member._id),
    fitnessRecordRepository.findByMember(member._id, { limit: 12 }),
  ]);
  return {
    ...base,
    locked: false,
    trainer,
    workoutPlan: plans.workoutPlans[0] || null,
    dietPlan: plans.dietPlans[0] || null,
    planCounts: { workout: plans.workoutPlans.length, diet: plans.dietPlans.length },
    progress,
    recentRecords: recentRecords.reverse(),
  };
}
