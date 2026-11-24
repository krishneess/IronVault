import mongoose from 'mongoose';

/** FitnessRecord – Member 1 "tracks" 0..* records. Measurements in cm, weight in kg. */
const fitnessRecordSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weight: { type: Number, required: true, min: 20, max: 400 },
    bodyFatPercentage: { type: Number, min: 2, max: 70 },
    chest: { type: Number, min: 30, max: 250 },
    waist: { type: Number, min: 30, max: 250 },
    arms: { type: Number, min: 10, max: 100 },
    legs: { type: Number, min: 20, max: 150 },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    recordDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

fitnessRecordSchema.index({ member: 1, recordDate: -1 });

const FitnessRecord = mongoose.model('FitnessRecord', fitnessRecordSchema);
export default FitnessRecord;
