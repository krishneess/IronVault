import mongoose from 'mongoose';
import User, { ROLES } from './User.js';

/** Trainer extends User – specialization, experience (years), bio. */
const trainerSchema = new mongoose.Schema({
  specialization: { type: String, trim: true, default: 'General Fitness', maxlength: 80 },
  experience: { type: Number, min: 0, max: 60, default: 0 },
  bio: { type: String, trim: true, default: '', maxlength: 1000 },
});

const Trainer = User.discriminator('Trainer', trainerSchema, ROLES.TRAINER);
export default Trainer;
