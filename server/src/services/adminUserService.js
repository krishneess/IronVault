import * as userRepository from '../repositories/userRepository.js';
import * as assignmentRepository from '../repositories/assignmentRepository.js';
import workoutPlanRepository from '../repositories/workoutPlanRepository.js';
import dietPlanRepository from '../repositories/dietPlanRepository.js';
import * as auditService from './auditService.js';
import * as assignmentService from './assignmentService.js';
import * as membershipService from './membershipService.js';
import * as fitnessRecordService from './fitnessRecordService.js';
import { ROLES, OPEN_STATUSES, MEMBERSHIP_STATUS } from '../models/index.js';
import { validity } from './membershipLifecycle.js';
import ApiError from '../utils/ApiError.js';
import { validate, hasErrors, isValidId, buildUpdate, pick } from '../utils/validators.js';
import {
  identitySchema,
  passwordRule,
  memberFieldsSchema,
  trainerFieldsSchema,
  optional,
  MEMBER_FIELDS,
  TRAINER_FIELDS,
} from './accountValidation.js';

const pageParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const parseActive = (status) => (status === 'active' ? true : status === 'inactive' ? false : undefined);

const ROLE_CONFIG = {
  [ROLES.MEMBER]: { label: 'Member', schema: memberFieldsSchema, fields: MEMBER_FIELDS, numbers: ['age', 'height', 'weight', 'experience'] },
  [ROLES.TRAINER]: { label: 'Trainer', schema: trainerFieldsSchema, fields: TRAINER_FIELDS, numbers: ['experience'] },
};

async function ensureUnique(email, username, excludeId) {
  const [emailTaken, usernameTaken] = await Promise.all([
    email ? userRepository.existsByEmail(email, excludeId) : null,
    username ? userRepository.existsByUsername(username, excludeId) : null,
  ]);
  if (emailTaken || usernameTaken) {
    throw new ApiError(409, 'Account already exists', {
      ...(emailTaken && { email: 'This email is already registered' }),
      ...(usernameTaken && { username: 'This username is taken' }),
    });
  }
}

async function loadUser(role, id) {
  if (!isValidId(id)) throw ApiError.badRequest(`Invalid ${role} id`);
  const user = role === ROLES.MEMBER ? await userRepository.findMemberById(id) : await userRepository.findTrainerById(id);
  if (!user) throw ApiError.notFound(`${ROLE_CONFIG[role].label} not found`);
  return user;
}

// ---------------------------------------------------------------- create / update / status (both roles)

export async function createAccount(admin, role, body = {}, req) {
  const cfg = ROLE_CONFIG[role];
  const errors = validate(body, { ...identitySchema, password: passwordRule, ...cfg.schema });
  if (hasErrors(errors)) throw ApiError.badRequest('Please correct the highlighted fields', errors);
  await ensureUnique(body.email, body.username);

  const data = pick(body, ['name', 'email', 'username', 'password', 'phone', ...cfg.fields]);
  for (const key of Object.keys(data)) {
    if (data[key] === '') delete data[key];
    else if (cfg.numbers.includes(key)) data[key] = Number(data[key]);
    else if (typeof data[key] === 'string' && key !== 'password') data[key] = data[key].trim();
  }
  const user = await userRepository.createUser(role, data);
  await auditService.record({
    actor: admin,
    action: `${role.toUpperCase()}_CREATED`,
    entity: 'User',
    entityId: user._id,
    description: `${cfg.label} account created: ${user.name} (${user.email})`,
    req,
  });
  return user;
}

export async function updateAccount(admin, role, id, body = {}, req) {
  const cfg = ROLE_CONFIG[role];
  await loadUser(role, id);
  const errors = validate(body, { ...optional(identitySchema), ...optional(cfg.schema) });
  for (const key of ['name', 'email', 'username', ...(role === ROLES.TRAINER ? ['specialization'] : [])]) {
    if (body[key] !== undefined && String(body[key]).trim() === '') errors[key] = `${key[0].toUpperCase()}${key.slice(1)} is required`;
  }
  if (body.newPassword) {
    const pwErrors = validate({ newPassword: body.newPassword }, { newPassword: { ...passwordRule, label: 'New password' } });
    Object.assign(errors, pwErrors);
  }
  if (hasErrors(errors)) throw ApiError.badRequest('Please correct the highlighted fields', errors);
  await ensureUnique(body.email, body.username, id);

  const { set, unset } = buildUpdate(body, {
    strings: ['name', 'email', 'username', 'phone', ...cfg.fields.filter((f) => !cfg.numbers.includes(f))],
    numbers: cfg.fields.filter((f) => cfg.numbers.includes(f)),
    optional: ['phone', ...cfg.fields.filter((f) => f !== 'specialization')],
  });
  if (set.email) set.email = set.email.toLowerCase();
  if (set.username) set.username = set.username.toLowerCase();

  let user = await userRepository.updateById(role, id, set, unset);
  if (body.newPassword) {
    const withPassword = await userRepository.findByIdWithPassword(id);
    withPassword.password = body.newPassword; // hashed by the model's pre-save hook
    await withPassword.save();
    user = await userRepository.findById(id);
  }
  await auditService.record({
    actor: admin,
    action: `${role.toUpperCase()}_UPDATED`,
    entity: 'User',
    entityId: user._id,
    description: `${cfg.label} account updated: ${user.name}${body.newPassword ? ' (password reset)' : ''}`,
    req,
  });
  return user;
}

/**
 * Activate / deactivate ("add and deactivate accounts").
 * Deactivating a member ends their trainer assignment and closes any open membership;
 * deactivating a trainer unassigns all of their members.
 */
export async function setAccountStatus(admin, role, id, isActive, req) {
  if (typeof isActive !== 'boolean') throw ApiError.badRequest('isActive must be true or false');
  const cfg = ROLE_CONFIG[role];
  const user = await loadUser(role, id);
  if (user.isActive === isActive) return { user, effects: {} };

  const effects = {};
  if (!isActive) {
    const reason = `${cfg.label} account deactivated`;
    if (role === ROLES.MEMBER) {
      effects.trainerUnassigned = Boolean(await assignmentService.endAssignmentIfAny(admin, id, reason, req));
      effects.membershipClosed = Boolean(await membershipService.closeOpenForMember(admin, id, reason, req));
    } else {
      effects.membersUnassigned = await assignmentService.endAllForTrainer(admin, id, reason, req);
    }
  }
  const updated = await userRepository.updateById(role, id, { isActive });
  await auditService.record({
    actor: admin,
    action: `${role.toUpperCase()}_${isActive ? 'ACTIVATED' : 'DEACTIVATED'}`,
    entity: 'User',
    entityId: id,
    description: `${cfg.label} account ${isActive ? 'reactivated' : 'deactivated'}: ${user.name}`,
    req,
  });
  return { user: updated, effects };
}

// ---------------------------------------------------------------- members

export async function listMembers(query = {}) {
  await membershipService.expireDueMemberships();
  const { page, limit, skip } = pageParams(query);
  const criteria = { role: ROLES.MEMBER, search: query.search, isActive: parseActive(query.status) };

  // Filter by trainer assignment.
  if (query.assignment === 'assigned' || query.assignment === 'unassigned') {
    const assigned = await assignmentRepository.activeMemberIds();
    criteria[query.assignment === 'assigned' ? 'ids' : 'excludeIds'] = assigned;
  }
  // Filter by membership status ("none" = no open membership).
  if (query.membership) {
    if (query.membership === 'none') {
      criteria.excludeIds = [...(criteria.excludeIds || []), ...(await membershipService.memberIdsWithStatus(OPEN_STATUSES))];
    } else if (Object.values(MEMBERSHIP_STATUS).includes(query.membership)) {
      const ids = await membershipService.memberIdsWithStatus([query.membership]);
      criteria.ids = criteria.ids ? criteria.ids.filter((x) => ids.some((y) => String(y) === String(x))) : ids;
    }
  }

  const { items, total } = await userRepository.listByRole({ ...criteria, skip, limit });
  const ids = items.map((m) => m._id);
  const [memberships, assignments] = await Promise.all([
    membershipService.currentForMembers(ids),
    assignmentRepository.activeForMembers(ids),
  ]);

  const rows = items.map((m) => {
    const membership = memberships.get(String(m._id));
    const assignment = assignments.get(String(m._id));
    return {
      ...m.toJSON(),
      membership: membership
        ? { _id: membership._id, planType: membership.planType, status: membership.status, endDate: membership.endDate, validity: validity(membership) }
        : null,
      trainer: assignment?.trainer || null,
    };
  });
  return { items: rows, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

export async function getMember(id) {
  const member = await loadUser(ROLES.MEMBER, id);
  const [membership, assignment, assignmentHistory, progress, workoutPlans, dietPlans] = await Promise.all([
    membershipService.getMemberOverview(id, ROLES.ADMIN),
    assignmentRepository.findActiveByMember(id),
    assignmentService.listAssignments({ memberId: id }),
    fitnessRecordService.summary(id),
    workoutPlanRepository.findAssignedToMember(id),
    dietPlanRepository.findAssignedToMember(id),
  ]);
  return {
    member,
    membership,
    trainer: assignment ? { trainer: assignment.trainer, assignedDate: assignment.assignedDate } : null,
    assignmentHistory,
    progress: { count: progress.count, latest: progress.latest, change: progress.change },
    plans: { workout: workoutPlans.length, diet: dietPlans.length },
  };
}

// ---------------------------------------------------------------- trainers

async function trainerLoads() {
  const [members, workout, diet] = await Promise.all([
    assignmentRepository.activeCountsByTrainer(),
    workoutPlanRepository.countsByTrainer(),
    dietPlanRepository.countsByTrainer(),
  ]);
  const toMap = (rows) => new Map(rows.map((r) => [String(r._id), r.count]));
  return { members: toMap(members), workout: toMap(workout), diet: toMap(diet) };
}

export async function listTrainers(query = {}) {
  const { page, limit, skip } = pageParams(query);
  const { items, total } = await userRepository.listByRole({
    role: ROLES.TRAINER,
    search: query.search,
    isActive: parseActive(query.status),
    skip,
    limit,
    sort: { name: 1 },
  });
  const loads = await trainerLoads();
  const rows = items.map((t) => ({
    ...t.toJSON(),
    stats: {
      activeMembers: loads.members.get(String(t._id)) || 0,
      workoutPlans: loads.workout.get(String(t._id)) || 0,
      dietPlans: loads.diet.get(String(t._id)) || 0,
    },
  }));
  return { items: rows, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

/** Active trainers with current member load – used by the allocation picker. */
export async function trainerOptions() {
  const [trainers, loads] = await Promise.all([userRepository.listOptions(ROLES.TRAINER), trainerLoads()]);
  return trainers.map((t) => ({ ...t.toJSON(), activeMembers: loads.members.get(String(t._id)) || 0 }));
}

export async function getTrainer(id) {
  const trainer = await loadUser(ROLES.TRAINER, id);
  const [assignments, workoutPlans, dietPlans] = await Promise.all([
    assignmentRepository.findActiveByTrainer(id),
    workoutPlanRepository.countByTrainer(id),
    dietPlanRepository.countByTrainer(id),
  ]);
  return {
    trainer,
    members: assignments.filter((a) => a.member).map((a) => ({ member: a.member, assignedDate: a.assignedDate })),
    stats: { activeMembers: assignments.length, workoutPlans, dietPlans },
  };
}
