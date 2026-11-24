import * as membershipRepository from '../repositories/membershipRepository.js';
import * as tierRepository from '../repositories/membershipTierRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import * as auditService from './auditService.js';
import { TRANSITIONS, availableActions, applyTransition, checkGuard, validity } from './membershipLifecycle.js';
import { MEMBERSHIP_STATUS as S, OPEN_STATUSES, PAYMENT_METHODS, ROLES } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { isValidId } from '../utils/validators.js';

const pageParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// ---------------------------------------------------------------- expiry (system transitions)

/** Applies "validity period ends" / "maximum hold duration exceeded" to one membership if due. */
async function expireIfDue(membership, now = new Date()) {
  if (!membership) return membership;
  const v = validity(membership, now);
  const due =
    (membership.status === S.ACTIVE && membership.endDate && membership.endDate <= now) ||
    (membership.status === S.SUSPENDED && v.holdEndsAt && v.holdEndsAt <= now);
  if (!due) return membership;
  const reason = membership.status === S.ACTIVE ? 'Validity period ended' : 'Maximum hold duration exceeded';
  applyTransition(membership, 'expire', { role: 'system', note: reason, now });
  await membership.save();
  await auditService.record({
    action: 'MEMBERSHIP_EXPIRED',
    entity: 'Membership',
    entityId: membership._id,
    description: `${membership.planType} membership expired automatically (${reason.toLowerCase()})`,
  });
  return membership;
}

let lastSweep = 0;

/** Expires every due membership. Runs on a timer and (throttled) before admin queries. */
export async function expireDueMemberships({ force = false } = {}) {
  if (!force && Date.now() - lastSweep < 30000) return 0;
  lastSweep = Date.now();
  const due = await membershipRepository.findDueForExpiry();
  for (const m of due) await expireIfDue(m);
  return due.length;
}

// ---------------------------------------------------------------- queries

function present(membership, role) {
  if (!membership) return null;
  const json = typeof membership.toJSON === 'function' ? membership.toJSON() : membership;
  return { ...json, validity: validity(membership), actions: availableActions(membership, role) };
}

/** Current = open membership if any, otherwise the latest one. */
async function currentFor(memberId) {
  const open = await membershipRepository.findOpenByMember(memberId);
  const current = open || (await membershipRepository.findLatestByMember(memberId));
  return expireIfDue(current);
}

/** checkStatus() – used by the membership access middleware. */
export async function getValidity(memberId) {
  const current = await currentFor(memberId);
  return { membership: current, ...validity(current) };
}

export async function getMemberOverview(memberId, role = ROLES.MEMBER) {
  const current = await currentFor(memberId);
  if (current) await current.populate('statusHistory.by', 'name role');
  const history = await membershipRepository.findByMember(memberId);
  return {
    current: present(current, role),
    validity: validity(current),
    canStartNew: !current || !OPEN_STATUSES.includes(current.status),
    history: history.map((m) => present(m, role)),
  };
}

export async function list(query = {}) {
  await expireDueMemberships();
  const { page, limit, skip } = pageParams(query);
  let memberIds;
  if (query.search) {
    const { items } = await userRepository.listByRole({ role: ROLES.MEMBER, search: query.search, limit: 500 });
    memberIds = items.map((m) => m._id);
  }
  const status = Object.values(S).includes(query.status) ? query.status : undefined;
  const tierId = isValidId(query.tierId) ? query.tierId : undefined;
  const { items, total } = await membershipRepository.list({ status, memberIds, tierId, skip, limit });
  return { items: items.map((m) => present(m, ROLES.ADMIN)), meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

export async function getById(id) {
  if (!isValidId(id)) throw ApiError.badRequest('Invalid membership id');
  await expireIfDue(await membershipRepository.findById(id));
  const membership = await membershipRepository.findByIdPopulated(id);
  if (!membership) throw ApiError.notFound('Membership not found');
  return present(membership, ROLES.ADMIN);
}

export async function statusCounts() {
  await expireDueMemberships();
  const rows = await membershipRepository.countByStatus();
  const counts = Object.fromEntries(Object.values(S).map((s) => [s, 0]));
  rows.forEach((r) => {
    counts[r._id] = r.count;
  });
  return counts;
}

export const expiringSoon = (days = 14, limit = 8) => membershipRepository.findExpiringWithin(days, limit);

// ---------------------------------------------------------------- commands

/** "Select membership plan" – creates a membership in the Created state. */
export async function create(actor, memberId, tierId, req) {
  if (!isValidId(memberId)) throw ApiError.badRequest('Select a valid member', { memberId: 'Select a valid member' });
  if (!isValidId(tierId)) throw ApiError.badRequest('Select a membership tier', { tierId: 'Select a membership tier' });

  const [member, tier] = await Promise.all([userRepository.findMemberById(memberId), tierRepository.findById(tierId)]);
  if (!member) throw ApiError.notFound('Member not found');
  if (!member.isActive) throw ApiError.badRequest('This member account is deactivated');
  if (!tier) throw ApiError.notFound('Membership tier not found');
  if (!tier.isActive) throw ApiError.badRequest('This membership tier is not currently offered', { tierId: 'Tier is inactive' });

  const current = await currentFor(memberId);
  if (current && OPEN_STATUSES.includes(current.status)) {
    throw ApiError.conflict(`There is already an open membership (${current.status.replace('_', ' ')}). Finish or cancel it first.`);
  }

  const membership = await membershipRepository.create({
    member: memberId,
    tier: tier._id,
    planType: tier.name,
    fee: tier.price,
    durationInDays: tier.durationInDays,
    maxHoldDays: tier.maxHoldDays,
    status: S.CREATED,
    createdBy: actor._id,
    statusHistory: [{ to: S.CREATED, action: 'select_plan', by: actor._id, byRole: actor.role, note: `Selected ${tier.name}` }],
  });

  await auditService.record({
    actor,
    action: 'MEMBERSHIP_CREATED',
    entity: 'Membership',
    entityId: membership._id,
    description: `${tier.name} membership created for ${member.name}`,
    req,
  });
  return present(membership, actor.role);
}

function validateTransitionInput(action, body) {
  const errors = {};
  const note = body.note ? String(body.note).trim() : '';
  if (note.length > 300) errors.note = 'Note must be at most 300 characters';
  let payment;
  if (action === 'verify_payment') {
    if (!PAYMENT_METHODS.includes(body.paymentMethod)) errors.paymentMethod = `Choose one of: ${PAYMENT_METHODS.join(', ')}`;
    const reference = body.paymentReference ? String(body.paymentReference).trim() : '';
    if (reference.length > 80) errors.paymentReference = 'Reference must be at most 80 characters';
    payment = { method: body.paymentMethod, reference };
  }
  if (['suspend', 'terminate', 'revoke'].includes(action) && !note) errors.note = 'Please give a reason';
  if (Object.keys(errors).length) throw ApiError.badRequest('Please correct the highlighted fields', errors);
  return { note, payment };
}

/** Performs a state-chart transition after checking role, ownership, source state and guards. */
export async function transition(actor, membershipId, action, body = {}, req) {
  if (!isValidId(membershipId)) throw ApiError.badRequest('Invalid membership id');
  const t = TRANSITIONS[action];
  if (!t || t.roles.every((r) => r === 'system')) throw ApiError.badRequest('Unknown membership action');

  let membership = await membershipRepository.findById(membershipId);
  if (!membership) throw ApiError.notFound('Membership not found');
  if (actor.role === ROLES.MEMBER && String(membership.member) !== String(actor._id)) throw ApiError.notFound('Membership not found');
  if (!t.roles.includes(actor.role)) throw ApiError.forbidden(`Only an administrator can ${t.label.toLowerCase()}`);

  membership = await expireIfDue(membership);
  if (!t.from.includes(membership.status)) {
    throw ApiError.conflict(`Cannot ${t.label.toLowerCase()} a membership that is ${membership.status.replace('_', ' ')}`);
  }
  const guardError = checkGuard(action, membership);
  if (guardError) throw ApiError.conflict(guardError);

  const { note, payment } = validateTransitionInput(action, body);
  const from = membership.status;
  applyTransition(membership, action, { actor, role: actor.role, note, payment });
  await membership.save();

  await auditService.record({
    actor,
    action: `MEMBERSHIP_${action.toUpperCase()}`,
    entity: 'Membership',
    entityId: membership._id,
    description: `${membership.planType}: ${from.replace('_', ' ')} → ${membership.status.replace('_', ' ')}${note ? ` (${note})` : ''}`,
    req,
  });
  return present(membership, actor.role);
}

/** Closes a member's open membership when their account is removed ("revoke [account removed]"). */
export async function closeOpenForMember(actor, memberId, reason, req) {
  const open = await membershipRepository.findOpenByMember(memberId);
  if (!open) return null;
  const actionByStatus = {
    [S.CREATED]: 'cancel_application',
    [S.PAYMENT_PENDING]: 'abandon_payment',
    [S.ACTIVE]: 'terminate',
    [S.SUSPENDED]: 'revoke',
  };
  const action = actionByStatus[open.status];
  applyTransition(open, action, { actor, role: actor.role, note: reason });
  await open.save();
  await auditService.record({
    actor,
    action: `MEMBERSHIP_${action.toUpperCase()}`,
    entity: 'Membership',
    entityId: open._id,
    description: `${open.planType} membership closed: ${reason}`,
    req,
  });
  return open;
}

export const currentForMembers = (memberIds) => membershipRepository.currentForMembers(memberIds);
export const memberIdsWithStatus = (statuses) => membershipRepository.memberIdsWithStatus(statuses);
