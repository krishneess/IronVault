import { MEMBERSHIP_STATUS as S } from '../models/index.js';

/**
 * Membership state machine – implements the IronVault state-chart diagram.
 *
 *   (start) ──select plan──▶ Created
 *   Created ──submit [valid details]──▶ PaymentPending
 *   Created ──cancel application [not submitted]──▶ Cancelled
 *   PaymentPending ──payment verified [payment successful]──▶ Active
 *   PaymentPending ──abandon payment [payment failed]──▶ Cancelled
 *   Active ──hold requested [suspension allowed]──▶ Suspended
 *   Active ──validity period ends [endDate reached]──▶ Expired      (system)
 *   Active ──terminate membership──▶ Cancelled
 *   Suspended ──maximum hold duration exceeded──▶ Expired           (system)
 *   Suspended ──revoke membership [account removed]──▶ Cancelled
 *   Expired ──member chooses not to renew──▶ Cancelled
 *
 * Addition (not drawn in the chart): Suspended ──resume──▶ Active, extending endDate by the hold length.
 */
export const TRANSITIONS = Object.freeze({
  submit: { from: [S.CREATED], to: S.PAYMENT_PENDING, roles: ['member', 'admin'], label: 'Submit application' },
  cancel_application: { from: [S.CREATED], to: S.CANCELLED, roles: ['member', 'admin'], label: 'Cancel application' },
  verify_payment: { from: [S.PAYMENT_PENDING], to: S.ACTIVE, roles: ['admin'], label: 'Verify payment' },
  abandon_payment: { from: [S.PAYMENT_PENDING], to: S.CANCELLED, roles: ['member', 'admin'], label: 'Abandon payment' },
  suspend: { from: [S.ACTIVE], to: S.SUSPENDED, roles: ['admin'], label: 'Place on hold' },
  resume: { from: [S.SUSPENDED], to: S.ACTIVE, roles: ['admin'], label: 'Resume' },
  terminate: { from: [S.ACTIVE], to: S.CANCELLED, roles: ['admin'], label: 'Terminate membership' },
  revoke: { from: [S.SUSPENDED], to: S.CANCELLED, roles: ['admin', 'system'], label: 'Revoke membership' },
  decline_renewal: { from: [S.EXPIRED], to: S.CANCELLED, roles: ['member', 'admin'], label: 'Decline renewal' },
  expire: { from: [S.ACTIVE, S.SUSPENDED], to: S.EXPIRED, roles: ['system'], label: 'Expire' },
});

export const DAY_MS = 86400000;

/** Hold length in whole days (nearest day, so request latency never adds an extra day). */
const heldDays = (since, now) => Math.max(0, Math.round((now - since) / DAY_MS));

export const holdDaysRemaining =(m) => Math.max(0, (m.maxHoldDays || 0) - (m.totalSuspendedDays || 0));

/** Guard conditions from the diagram. Returns an error message or null. */
export function checkGuard(action, membership, now = new Date()) {
  if (action === 'suspend') {
    if (!membership.maxHoldDays) return 'This membership tier does not allow holds';
    if (holdDaysRemaining(membership) <= 0) return 'The maximum hold duration for this membership has been used';
    if (membership.endDate && membership.endDate <= now) return 'This membership has already reached its end date';
  }
  return null;
}

/** Actions a given role may perform on a membership right now (used by the API and UI). */
export function availableActions(membership, role, now = new Date()) {
  return Object.entries(TRANSITIONS)
    .filter(([action, t]) => t.roles.includes(role) && t.from.includes(membership.status) && !checkGuard(action, membership, now))
    .map(([action, t]) => ({ action, label: t.label, to: t.to }));
}

/**
 * Applies an action's side effects to a membership document (mutates it).
 * Validation of role / source state / guards must be done by the caller.
 */
export function applyTransition(membership, action, { actor, role, note, payment, now = new Date() } = {}) {
  const t = TRANSITIONS[action];
  const from = membership.status;

  switch (action) {
    case 'verify_payment':
      membership.startDate = now;
      membership.endDate = new Date(now.getTime() + membership.durationInDays * DAY_MS);
      membership.payment = { ...payment, verifiedAt: now, verifiedBy: actor?._id };
      break;
    case 'suspend':
      membership.suspendedAt = now;
      break;
    case 'resume': {
      const heldMs = Math.max(0, now - membership.suspendedAt);
      membership.totalSuspendedDays = (membership.totalSuspendedDays || 0) + heldDays(membership.suspendedAt, now);
      membership.endDate = new Date(membership.endDate.getTime() + heldMs);
      membership.suspendedAt = undefined;
      break;
    }
    default:
      break;
  }

  if (t.to === S.CANCELLED || t.to === S.EXPIRED) {
    if (from === S.SUSPENDED && membership.suspendedAt) {
      membership.totalSuspendedDays = (membership.totalSuspendedDays || 0) + heldDays(membership.suspendedAt, now);
      membership.suspendedAt = undefined;
    }
    if (note) membership.closedReason = note;
  }

  membership.status = t.to;
  membership.statusHistory.push({ from, to: t.to, action, at: now, by: actor?._id, byRole: role, note: note || '' });
  return membership;
}

/** Validity summary – checkStatus() in the class diagram. */
export function validity(membership, now = new Date()) {
  if (!membership) return { isValid: false, status: 'none', daysRemaining: 0 };
  const isValid = membership.status === S.ACTIVE && (!membership.endDate || membership.endDate > now);
  const daysRemaining = membership.endDate ? Math.max(0, Math.ceil((membership.endDate - now) / DAY_MS)) : null;
  const holdEndsAt =
    membership.status === S.SUSPENDED && membership.suspendedAt
      ? new Date(membership.suspendedAt.getTime() + holdDaysRemaining(membership) * DAY_MS)
      : null;
  return { isValid, status: membership.status, daysRemaining, holdDaysRemaining: holdDaysRemaining(membership), holdEndsAt };
}
