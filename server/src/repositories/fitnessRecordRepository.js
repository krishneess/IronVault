import { FitnessRecord } from '../models/index.js';

/** Fitness Record Repository – progress data access. */
export function findByMember(memberId, { from, to, limit } = {}) {
  const filter = { member: memberId };
  if (from || to) {
    filter.recordDate = {};
    if (from) filter.recordDate.$gte = new Date(from);
    if (to) filter.recordDate.$lte = new Date(to);
  }
  const query = FitnessRecord.find(filter).sort({ recordDate: -1, createdAt: -1 });
  if (limit) query.limit(limit);
  return query;
}

export const findOneForMember = (id, memberId) => FitnessRecord.findOne({ _id: id, member: memberId });

export const create = (data) => FitnessRecord.create(data);

export const updateForMember = (id, memberId, data) =>
  FitnessRecord.findOneAndUpdate({ _id: id, member: memberId }, data, { new: true, runValidators: true });

export const deleteForMember = (id, memberId) => FitnessRecord.findOneAndDelete({ _id: id, member: memberId });

export const findLatest = (memberId) => FitnessRecord.findOne({ member: memberId }).sort({ recordDate: -1, createdAt: -1 });

export const findFirst = (memberId) => FitnessRecord.findOne({ member: memberId }).sort({ recordDate: 1, createdAt: 1 });

export const countByMember = (memberId) => FitnessRecord.countDocuments({ member: memberId });

/** Most recent record per member for a list of members. */
export const findLatestForMembers = (memberIds) =>
  FitnessRecord.aggregate([
    { $match: { member: { $in: memberIds } } },
    { $sort: { recordDate: -1, createdAt: -1 } },
    { $group: { _id: '$member', record: { $first: '$$ROOT' } } },
  ]);

export const countAll = () => FitnessRecord.countDocuments();

export const countBetween = (from, to) => FitnessRecord.countDocuments({ recordDate: { $gte: from, $lte: to } });
