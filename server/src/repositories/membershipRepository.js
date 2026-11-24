import { Membership, MEMBERSHIP_STATUS, OPEN_STATUSES } from '../models/index.js';
import { DAY_MS } from '../services/membershipLifecycle.js';

const MEMBER_FIELDS = 'name email username phone isActive';

/** Membership (subscription) data access. */
export const findById = (id) => Membership.findById(id);

export const findByIdPopulated = (id) =>
  Membership.findById(id)
    .populate('member', MEMBER_FIELDS)
    .populate('tier', 'name isActive')
    .populate('statusHistory.by', 'name role')
    .populate('payment.verifiedBy', 'name');

export const findOpenByMember = (memberId) => Membership.findOne({ member: memberId, status: { $in: OPEN_STATUSES } });

export const findLatestByMember = (memberId) => Membership.findOne({ member: memberId }).sort({ createdAt: -1 });

export const findByMember = (memberId) =>
  Membership.find({ member: memberId }).sort({ createdAt: -1 }).populate('statusHistory.by', 'name role');

export const existsForTier = (tierId) => Membership.exists({ tier: tierId });

export const create = (data) => Membership.create(data);

/** Current (open, else latest) membership for many members at once. */
export async function currentForMembers(memberIds) {
  const rows = await Membership.aggregate([
    { $match: { member: { $in: memberIds } } },
    { $addFields: { isOpen: { $in: ['$status', OPEN_STATUSES] } } },
    { $sort: { isOpen: -1, createdAt: -1 } },
    { $group: { _id: '$member', membership: { $first: '$$ROOT' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.membership]));
}

export const memberIdsWithStatus = (statuses) =>
  Membership.distinct('member', { status: { $in: statuses } });

export async function list({ status, memberIds, tierId, skip = 0, limit = 20 }) {
  const filter = {};
  if (status) filter.status = status;
  if (memberIds) filter.member = { $in: memberIds };
  if (tierId) filter.tier = tierId;
  const [items, total] = await Promise.all([
    Membership.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('member', MEMBER_FIELDS),
    Membership.countDocuments(filter),
  ]);
  return { items, total };
}

export const countByStatus = () =>
  Membership.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

/** Active memberships whose end date falls within the next `days` days. */
export const findExpiringWithin = (days, limit = 10) =>
  Membership.find({
    status: MEMBERSHIP_STATUS.ACTIVE,
    endDate: { $gte: new Date(), $lte: new Date(Date.now() + days * DAY_MS) },
  })
    .sort({ endDate: 1 })
    .limit(limit)
    .populate('member', MEMBER_FIELDS);

/** Memberships due for automatic expiry (end date reached, or hold allowance used up). */
export function findDueForExpiry(now = new Date()) {
  return Membership.find({
    $or: [
      { status: MEMBERSHIP_STATUS.ACTIVE, endDate: { $lte: now } },
      {
        status: MEMBERSHIP_STATUS.SUSPENDED,
        $expr: {
          $lte: [
            { $add: ['$suspendedAt', { $multiply: [{ $max: [0, { $subtract: ['$maxHoldDays', '$totalSuspendedDays'] }] }, DAY_MS] }] },
            now,
          ],
        },
      },
    ],
  });
}

/** Revenue from payments verified in a period, grouped by plan type. */
export const revenueByPlanType = (from, to) =>
  Membership.aggregate([
    { $match: { 'payment.verifiedAt': { $gte: from, $lte: to } } },
    { $group: { _id: '$planType', revenue: { $sum: '$fee' }, count: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
  ]);
