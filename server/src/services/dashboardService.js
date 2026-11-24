import * as userRepository from '../repositories/userRepository.js';
import * as auditService from './auditService.js';
import { ROLES } from '../models/index.js';

/**
 * Role-specific dashboard summaries. Later phases extend these with plan,
 * progress, membership and reporting data.
 */
export async function adminSummary() {
  const [members, activeMembers, trainers, activeTrainers, admins, recentActivity] = await Promise.all([
    userRepository.countByRole(ROLES.MEMBER),
    userRepository.countByRole(ROLES.MEMBER, { isActive: true }),
    userRepository.countByRole(ROLES.TRAINER),
    userRepository.countByRole(ROLES.TRAINER, { isActive: true }),
    userRepository.countByRole(ROLES.ADMIN),
    auditService.recent(8),
  ]);
  return {
    counts: { members, activeMembers, trainers, activeTrainers, admins },
    recentActivity,
  };
}

export async function trainerSummary(trainer) {
  return { profile: trainer };
}

export async function memberSummary(member) {
  return { profile: member };
}
