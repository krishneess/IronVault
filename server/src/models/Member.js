import mongoose from 'mongoose';
import User, { ROLES } from './User.js';

export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

/** Member extends User – age, gender, height (cm), weight (kg), fitnessGoal, joinDate. */
const memberSchema = new mongoose.Schema({
  age: { type: Number, min: 10, max: 100 },
  gender: { type: String, enum: GENDERS },
  height: { type: Number, min: 50, max: 260 },
  weight: { type: Number, min: 20, max: 400 },
  fitnessGoal: { type: String, trim: true, default: '', maxlength: 200 },
  joinDate: { type: Date, default: Date.now },
});

const Member = User.discriminator('Member', memberSchema, ROLES.MEMBER);
export default Member;
