import mongoose from 'mongoose';

export const ASSIGNMENT_STATUS = { ACTIVE: 'active', ENDED: 'ended' };

/**
 * TrainerAssignment – links a Member to a Trainer (assigned by an Admin).
 * History is kept: reassigning ends the previous assignment. One active assignment per member.
 */
const trainerAssignmentSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedDate: { type: Date, default: Date.now },
    status: { type: String, enum: Object.values(ASSIGNMENT_STATUS), default: ASSIGNMENT_STATUS.ACTIVE },
    endedAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

trainerAssignmentSchema.index(
  { member: 1 },
  { unique: true, partialFilterExpression: { status: ASSIGNMENT_STATUS.ACTIVE } }
);
trainerAssignmentSchema.index({ trainer: 1, status: 1 });

const TrainerAssignment = mongoose.model('TrainerAssignment', trainerAssignmentSchema);
export default TrainerAssignment;
