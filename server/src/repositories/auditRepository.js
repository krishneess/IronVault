import { AuditLog } from '../models/index.js';
import { escapeRegex } from '../utils/validators.js';

export const create = (entry) => AuditLog.create(entry);

export const findRecent = (limit = 10) =>
  AuditLog.find().sort({ createdAt: -1 }).limit(limit).populate('actor', 'name role email');

/** Paginated audit search for the admin activity monitor. */
export async function search({ action, actorRole, entity, text, from, to, skip = 0, limit = 25 }) {
  const filter = {};
  if (action) filter.action = action;
  if (actorRole) filter.actorRole = actorRole;
  if (entity) filter.entity = entity;
  if (text) filter.description = { $regex: escapeRegex(text), $options: 'i' };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actor', 'name role email'),
    AuditLog.countDocuments(filter),
  ]);
  return { items, total };
}

export const distinctActions = () => AuditLog.distinct('action');

export const countBetween = (from, to) => AuditLog.countDocuments({ createdAt: { $gte: from, $lte: to } });
