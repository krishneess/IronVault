import * as auditRepository from '../repositories/auditRepository.js';
import { ROLE_LIST } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Records an audit entry. Never throws – auditing must not break the main operation.
 * Entries without an actor are system events (e.g. automatic membership expiry).
 */
export async function record({ actor, action, entity, entityId, description, req }) {
  try {
    await auditRepository.create({
      actor: actor?._id || actor,
      actorRole: actor?.role || (actor ? undefined : 'system'),
      action,
      entity,
      entityId,
      description,
      ip: req?.ip,
    });
  } catch (err) {
    console.error('[audit] Failed to record audit entry:', err.message);
  }
}

export const recent = (limit) => auditRepository.findRecent(limit);

/** Admin activity monitor: filtered, paginated audit records. */
export async function search(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const parseDate = (v, endOfDay) => {
    if (!v) return undefined;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) throw ApiError.badRequest('Invalid date filter');
    if (endOfDay) d.setHours(23, 59, 59, 999);
    return d;
  };
  const actorRole = [...ROLE_LIST, 'system'].includes(query.actorRole) ? query.actorRole : undefined;
  const action = typeof query.action === 'string' && /^[A-Z_]{3,60}$/.test(query.action) ? query.action : undefined;

  const [{ items, total }, actions] = await Promise.all([
    auditRepository.search({
      action,
      actorRole,
      text: query.search ? String(query.search).slice(0, 100) : undefined,
      from: parseDate(query.from),
      to: parseDate(query.to, true),
      skip: (page - 1) * limit,
      limit,
    }),
    auditRepository.distinctActions(),
  ]);
  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1, actions: actions.sort() } };
}
