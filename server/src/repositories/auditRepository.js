import { AuditLog } from '../models/index.js';

export const create = (entry) => AuditLog.create(entry);

export const findRecent = (limit = 10) =>
  AuditLog.find().sort({ createdAt: -1 }).limit(limit).populate('actor', 'name role email');
