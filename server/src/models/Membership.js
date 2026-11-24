import mongoose from 'mongoose';

/** States from the IronVault state-chart diagram. */
export const MEMBERSHIP_STATUS = Object.freeze({
  CREATED: 'created',
  PAYMENT_PENDING: 'payment_pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
});

/** States in which a member still "holds" a membership (at most one at a time). */
export const OPEN_STATUSES = [
  MEMBERSHIP_STATUS.CREATED,
  MEMBERSHIP_STATUS.PAYMENT_PENDING,
  MEMBERSHIP_STATUS.ACTIVE,
  MEMBERSHIP_STATUS.SUSPENDED,
];

export const PAYMENT_METHODS = ['cash', 'card', 'upi', 'bank_transfer'];

const statusChangeSchema = new mongoose.Schema(
  {
    from: { type: String },
    to: { type: String, required: true },
    action: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byRole: { type: String }, // member | admin | system
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { _id: false }
);

/**
 * Membership – Member 1 "has" 0..* memberships. Tier details are snapshotted
 * (planType, fee, durationInDays, maxHoldDays) so later tier edits don't rewrite history.
 */
const membershipSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tier: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipTier', required: true },
    planType: { type: String, required: true },
    fee: { type: Number, required: true, min: 0 },
    durationInDays: { type: Number, required: true, min: 1 },
    maxHoldDays: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(MEMBERSHIP_STATUS), default: MEMBERSHIP_STATUS.CREATED, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    suspendedAt: { type: Date },
    totalSuspendedDays: { type: Number, default: 0, min: 0 },
    payment: {
      method: { type: String, enum: PAYMENT_METHODS },
      reference: { type: String, trim: true, maxlength: 80 },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    closedReason: { type: String, trim: true, maxlength: 300, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    statusHistory: { type: [statusChangeSchema], default: [] },
  },
  { timestamps: true }
);

membershipSchema.index({ member: 1, createdAt: -1 });
membershipSchema.index({ status: 1, endDate: 1 });
// At most one open membership per member.
membershipSchema.index(
  { member: 1 },
  { unique: true, partialFilterExpression: { status: { $in: OPEN_STATUSES } }, name: 'one_open_membership_per_member' }
);

const Membership = mongoose.model('Membership', membershipSchema);
export default Membership;
