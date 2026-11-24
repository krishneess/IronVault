import * as userRepository from '../repositories/userRepository.js';
import * as membershipRepository from '../repositories/membershipRepository.js';
import * as fitnessRecordRepository from '../repositories/fitnessRecordRepository.js';
import * as auditRepository from '../repositories/auditRepository.js';
import * as membershipService from './membershipService.js';
import * as adminUserService from './adminUserService.js';
import { ROLES } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

const DAY = 86400000;

function parsePeriod({ from, to }) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 29 * DAY);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw ApiError.badRequest('Invalid date range');
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (start > end) throw ApiError.badRequest('"From" must be before "To"');
  if (end - start > 3 * 366 * DAY) throw ApiError.badRequest('Date range can be at most 3 years');
  return { start, end };
}

/** Last 12 calendar months, zero-filled. */
function monthSeries(rows, months = 12) {
  const now = new Date();
  const counts = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.count]));
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, count: counts.get(`${d.getFullYear()}-${d.getMonth() + 1}`) || 0 };
  });
}

/** Operational report – generateOperationalReports() in the class diagram. */
export async function operational(query = {}) {
  const { start, end } = parsePeriod(query);
  const yearAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);

  const [
    members,
    activeMembers,
    newMembers,
    trainers,
    activeTrainers,
    membershipStatus,
    revenueRows,
    signups,
    expiring,
    recordsLogged,
    auditEvents,
    trainerLoad,
  ] = await Promise.all([
    userRepository.countByRole(ROLES.MEMBER),
    userRepository.countByRole(ROLES.MEMBER, { isActive: true }),
    userRepository.countCreatedBetween(ROLES.MEMBER, start, end),
    userRepository.countByRole(ROLES.TRAINER),
    userRepository.countByRole(ROLES.TRAINER, { isActive: true }),
    membershipService.statusCounts(),
    membershipRepository.revenueByPlanType(start, end),
    userRepository.signupsByMonth(ROLES.MEMBER, yearAgo),
    membershipService.expiringSoon(30, 20),
    fitnessRecordRepository.countBetween(start, end),
    auditRepository.countBetween(start, end),
    adminUserService.listTrainers({ limit: 100 }),
  ]);

  const revenueByPlan = revenueRows.map((r) => ({ planType: r._id, revenue: r.revenue, count: r.count }));

  return {
    period: { from: start, to: end },
    generatedAt: new Date(),
    members: { total: members, active: activeMembers, inactive: members - activeMembers, newInPeriod: newMembers },
    trainers: { total: trainers, active: activeTrainers },
    memberships: { byStatus: membershipStatus, expiringSoon: expiring },
    revenue: {
      total: revenueByPlan.reduce((s, r) => s + r.revenue, 0),
      payments: revenueByPlan.reduce((s, r) => s + r.count, 0),
      byPlanType: revenueByPlan,
    },
    signupsByMonth: monthSeries(signups),
    activity: { fitnessRecordsLogged: recordsLogged, auditEvents },
    trainerLoad: trainerLoad.items.map((t) => ({
      _id: t._id,
      name: t.name,
      specialization: t.specialization,
      isActive: t.isActive,
      ...t.stats,
    })),
  };
}
