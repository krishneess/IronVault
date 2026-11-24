import { escapeRegex } from '../utils/validators.js';

const MEMBER_FIELDS = 'name email username phone';
const TRAINER_FIELDS = 'name email specialization experience';

/**
 * Builds the data-access functions shared by WorkoutPlan and DietPlan repositories.
 * Both plan types store the owning trainer and an `assignedMembers` list.
 */
export default function createPlanRepository(Model) {
  return {
    findByTrainer(trainerId, { search, level } = {}) {
      const filter = { trainer: trainerId };
      if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
      if (level) filter.level = level;
      return Model.find(filter).sort({ updatedAt: -1 }).populate('assignedMembers.member', MEMBER_FIELDS);
    },

    findAll({ search } = {}) {
      const filter = search ? { title: { $regex: escapeRegex(search), $options: 'i' } } : {};
      return Model.find(filter).sort({ updatedAt: -1 }).populate('trainer', TRAINER_FIELDS);
    },

    findById: (id) => Model.findById(id),

    findByIdPopulated: (id) =>
      Model.findById(id).populate('trainer', TRAINER_FIELDS).populate('assignedMembers.member', MEMBER_FIELDS),

    findAssignedToMember: (memberId) =>
      Model.find({ 'assignedMembers.member': memberId })
        .sort({ updatedAt: -1 })
        .populate('trainer', TRAINER_FIELDS)
        .select('-assignedMembers'),

    findByTrainerAssignedToMember: (trainerId, memberId) =>
      Model.find({ trainer: trainerId, 'assignedMembers.member': memberId }).sort({ updatedAt: -1 }).select('-assignedMembers'),

    create: (data) => Model.create(data),

    updateById: (id, data) => Model.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

    deleteById: (id) => Model.findByIdAndDelete(id),

    addMember: (planId, memberId) =>
      Model.findOneAndUpdate(
        { _id: planId, 'assignedMembers.member': { $ne: memberId } },
        { $push: { assignedMembers: { member: memberId, assignedAt: new Date() } } },
        { new: true }
      ),

    removeMember: (planId, memberId) =>
      Model.findByIdAndUpdate(planId, { $pull: { assignedMembers: { member: memberId } } }, { new: true }),

    /** Detach a member from every plan of a trainer (used when the trainer assignment ends). */
    removeMemberFromTrainerPlans: (trainerId, memberId) =>
      Model.updateMany({ trainer: trainerId }, { $pull: { assignedMembers: { member: memberId } } }),

    countByTrainer: (trainerId) => Model.countDocuments({ trainer: trainerId }),

    count: () => Model.countDocuments(),

    countsByTrainer: () => Model.aggregate([{ $group: { _id: '$trainer', count: { $sum: 1 } } }]),
  };
}
