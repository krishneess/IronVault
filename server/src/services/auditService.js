import * as auditRepository from '../repositories/auditRepository.js';

/**
 * Records an audit entry. Never throws – auditing must not break the main operation.
 */
export async function record({ actor, action, entity, entityId, description, req }) {
  try {
    await auditRepository.create({
      actor: actor?._id || actor,
      actorRole: actor?.role,
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
