import mongoose from 'mongoose';

/**
 * Membership tier (PlanType) – configured by an Admin.
 * maxHoldDays = 0 means suspension (hold) is not allowed for this tier.
 */
const membershipTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    durationInDays: { type: Number, required: true, min: 1, max: 1825 },
    price: { type: Number, required: true, min: 0, max: 1000000 },
    features: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    maxHoldDays: { type: Number, min: 0, max: 365, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

membershipTierSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const MembershipTier = mongoose.model('MembershipTier', membershipTierSchema);
export default MembershipTier;
