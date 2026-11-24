import mongoose from 'mongoose';

export const PLAN_LEVELS = ['beginner', 'intermediate', 'advanced'];

/** Exercise – composed into WorkoutPlan (1..* "contains"). */
const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    sets: { type: Number, required: true, min: 1, max: 20 },
    repetitions: { type: Number, required: true, min: 1, max: 200 },
    restTime: { type: Number, min: 0, max: 900, default: 60 }, // seconds
    notes: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { _id: true }
);

/** Members a plan is assigned to ("assigned to" 0..* relationship). */
export const planAssignmentSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    level: { type: String, enum: PLAN_LEVELS, required: true },
    durationInWeeks: { type: Number, required: true, min: 1, max: 104 },
    exercises: {
      type: [exerciseSchema],
      validate: { validator: (v) => v.length >= 1, message: 'A workout plan needs at least one exercise' },
    },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedMembers: { type: [planAssignmentSchema], default: [] },
  },
  { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedAt' } }
);

workoutPlanSchema.index({ 'assignedMembers.member': 1 });

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);
export default WorkoutPlan;
