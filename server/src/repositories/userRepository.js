import { User, Member, Trainer, Admin, ROLES } from '../models/index.js';

/**
 * Member / Trainer / Admin Repository – the only module that queries the `users` collection.
 * Services call these functions; controllers never touch Mongoose directly.
 */
const modelForRole = {
  [ROLES.MEMBER]: Member,
  [ROLES.TRAINER]: Trainer,
  [ROLES.ADMIN]: Admin,
};

export const findById = (id) => User.findById(id);

export const findByIdWithPassword = (id) => User.findById(id).select('+password');

export const findByEmailOrUsername = (identifier) => {
  const value = String(identifier).toLowerCase().trim();
  return User.findOne({ $or: [{ email: value }, { username: value }] }).select('+password');
};

export const existsByEmail = (email, excludeId) =>
  User.exists({ email: String(email).toLowerCase().trim(), ...(excludeId && { _id: { $ne: excludeId } }) });

export const existsByUsername = (username, excludeId) =>
  User.exists({ username: String(username).toLowerCase().trim(), ...(excludeId && { _id: { $ne: excludeId } }) });

export const createUser = (role, data) => modelForRole[role].create(data);

export const countByRole = (role, filter = {}) => User.countDocuments({ role, ...filter });

export const touchLastLogin = (id) => User.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
