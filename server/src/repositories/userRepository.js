import { User, Member, Trainer, Admin, ROLES } from '../models/index.js';
import { escapeRegex } from '../utils/validators.js';

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

export const findMemberById = (id) => Member.findById(id);

export const findTrainerById = (id) => Trainer.findById(id);

/**
 * Updates a user through its role model so role-specific fields are validated.
 * `set` fields are written, `unset` fields (optional values cleared by the user) are removed.
 */
export const updateById = (role, id, set = {}, unset = []) => {
  const update = {};
  if (Object.keys(set).length) update.$set = set;
  if (unset.length) update.$unset = Object.fromEntries(unset.map((k) => [k, 1]));
  return modelForRole[role].findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

export const touchLastLogin = (id) => User.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });

function buildListFilter({ role, search, isActive, ids, excludeIds }) {
  const filter = { role };
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { username: rx }, { phone: rx }];
  }
  if (typeof isActive === 'boolean') filter.isActive = isActive;
  if (ids || excludeIds) {
    filter._id = {};
    if (ids) filter._id.$in = ids;
    if (excludeIds) filter._id.$nin = excludeIds;
  }
  return filter;
}

/** Paginated, searchable list of users of one role. */
export async function listByRole({ skip = 0, limit = 20, sort = { createdAt: -1 }, ...criteria }) {
  const filter = buildListFilter(criteria);
  const Model = modelForRole[criteria.role];
  const [items, total] = await Promise.all([
    Model.find(filter).sort(sort).skip(skip).limit(limit),
    Model.countDocuments(filter),
  ]);
  return { items, total };
}

/** Lightweight id/name list for pickers (e.g. trainer allocation). */
export const listOptions = (role, { activeOnly = true } = {}) =>
  modelForRole[role].find(activeOnly ? { isActive: true } : {}).sort({ name: 1 }).select('name email specialization isActive');

export const countCreatedBetween = (role, from, to) => User.countDocuments({ role, createdAt: { $gte: from, $lte: to } });

/** New accounts per calendar month since a date. */
export const signupsByMonth = (role, since) =>
  User.aggregate([
    { $match: { role, createdAt: { $gte: since } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);
