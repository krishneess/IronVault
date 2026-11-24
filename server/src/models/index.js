// Registers every model (and discriminator) with Mongoose.
export { default as User, ROLES, ROLE_LIST } from './User.js';
export { default as Admin } from './Admin.js';
export { default as Trainer } from './Trainer.js';
export { default as Member, GENDERS } from './Member.js';
export { default as AuditLog } from './AuditLog.js';
export { default as WorkoutPlan, PLAN_LEVELS } from './WorkoutPlan.js';
export { default as DietPlan } from './DietPlan.js';
export { default as FitnessRecord } from './FitnessRecord.js';
export { default as TrainerAssignment, ASSIGNMENT_STATUS } from './TrainerAssignment.js';
export { default as MembershipTier } from './MembershipTier.js';
export { default as Membership, MEMBERSHIP_STATUS, OPEN_STATUSES, PAYMENT_METHODS } from './Membership.js';
