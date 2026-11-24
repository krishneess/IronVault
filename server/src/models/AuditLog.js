import mongoose from 'mongoose';

/** Audit record of significant system activity (logins, account and data changes). */
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    action: { type: String, required: true, index: true }, // e.g. AUTH_LOGIN, MEMBER_CREATED
    entity: { type: String }, // e.g. User, WorkoutPlan
    entityId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, default: '' },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
