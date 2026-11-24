import { MembershipTier } from '../models/index.js';

/** Membership tier (PlanType) data access. */
export const findAll = ({ activeOnly = false } = {}) =>
  MembershipTier.find(activeOnly ? { isActive: true } : {}).sort({ price: 1, name: 1 });

export const findById = (id) => MembershipTier.findById(id);

export const existsByName = (name, excludeId) =>
  MembershipTier.exists({ name: String(name).trim(), ...(excludeId && { _id: { $ne: excludeId } }) }).collation({
    locale: 'en',
    strength: 2,
  });

export const create = (data) => MembershipTier.create(data);

export const updateById = (id, data) => MembershipTier.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });

export const deleteById = (id) => MembershipTier.findByIdAndDelete(id);
