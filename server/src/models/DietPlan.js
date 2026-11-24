import mongoose from 'mongoose';
import { planAssignmentSchema } from './WorkoutPlan.js';

/** Meal – composed into DietPlan (1..* "contains"). */
const mealSchema = new mongoose.Schema(
  {
    mealName: { type: String, required: true, trim: true, maxlength: 100 },
    time: { type: String, trim: true, maxlength: 20, default: '' }, // e.g. "07:30"
    calories: { type: Number, required: true, min: 0, max: 5000 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: true }
);

const dietPlanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    calorieTarget: { type: Number, required: true, min: 800, max: 10000 },
    goal: { type: String, required: true, trim: true, maxlength: 120 },
    meals: {
      type: [mealSchema],
      validate: { validator: (v) => v.length >= 1, message: 'A diet plan needs at least one meal' },
    },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedMembers: { type: [planAssignmentSchema], default: [] },
  },
  { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedAt' } }
);

dietPlanSchema.index({ 'assignedMembers.member': 1 });

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);
export default DietPlan;
