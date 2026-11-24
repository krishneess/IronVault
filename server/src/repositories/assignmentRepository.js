import { TrainerAssignment, ASSIGNMENT_STATUS } from '../models/index.js';

const MEMBER_FIELDS = 'name email username phone age gender height weight fitnessGoal joinDate isActive';
const TRAINER_FIELDS = 'name email username phone specialization experience bio isActive';

/** Trainer Assignment Repository – trainer ↔ member allocation data access. */
export const findActiveByMember = (memberId) =>
  TrainerAssignment.findOne({ member: memberId, status: ASSIGNMENT_STATUS.ACTIVE }).populate('trainer', TRAINER_FIELDS);

export const findActiveByTrainer = (trainerId) =>
  TrainerAssignment.find({ trainer: trainerId, status: ASSIGNMENT_STATUS.ACTIVE })
    .sort({ assignedDate: -1 })
    .populate('member', MEMBER_FIELDS);

export const existsActive = (trainerId, memberId) =>
  TrainerAssignment.exists({ trainer: trainerId, member: memberId, status: ASSIGNMENT_STATUS.ACTIVE });

export const countActiveByTrainer = (trainerId) =>
  TrainerAssignment.countDocuments({ trainer: trainerId, status: ASSIGNMENT_STATUS.ACTIVE });

export const create = (data) => TrainerAssignment.create(data);

export const endActiveForMember = (memberId) =>
  TrainerAssignment.findOneAndUpdate(
    { member: memberId, status: ASSIGNMENT_STATUS.ACTIVE },
    { $set: { status: ASSIGNMENT_STATUS.ENDED, endedAt: new Date() } },
    { new: true }
  );

export const findById = (id) => TrainerAssignment.findById(id);

/** Active assignment per member for many members at once. */
export async function activeForMembers(memberIds) {
  const rows = await TrainerAssignment.find({ member: { $in: memberIds }, status: ASSIGNMENT_STATUS.ACTIVE }).populate(
    'trainer',
    'name email specialization isActive'
  );
  return new Map(rows.map((a) => [String(a.member), a]));
}

export const activeMemberIds = () => TrainerAssignment.distinct('member', { status: ASSIGNMENT_STATUS.ACTIVE });

export const activeMemberIdsForTrainer = (trainerId) =>
  TrainerAssignment.distinct('member', { trainer: trainerId, status: ASSIGNMENT_STATUS.ACTIVE });

/** Number of active members per trainer. */
export const activeCountsByTrainer = () =>
  TrainerAssignment.aggregate([{ $match: { status: ASSIGNMENT_STATUS.ACTIVE } }, { $group: { _id: '$trainer', count: { $sum: 1 } } }]);

/** Ends every active assignment of a trainer; returns the ended assignments. */
export async function endAllForTrainer(trainerId) {
  const active = await TrainerAssignment.find({ trainer: trainerId, status: ASSIGNMENT_STATUS.ACTIVE });
  if (active.length) {
    await TrainerAssignment.updateMany(
      { trainer: trainerId, status: ASSIGNMENT_STATUS.ACTIVE },
      { $set: { status: ASSIGNMENT_STATUS.ENDED, endedAt: new Date() } }
    );
  }
  return active;
}

export const list = (filter = {}) =>
  TrainerAssignment.find(filter)
    .sort({ assignedDate: -1 })
    .populate('member', MEMBER_FIELDS)
    .populate('trainer', TRAINER_FIELDS)
    .populate('assignedBy', 'name email');
