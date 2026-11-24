import * as auditService from './auditService.js';
import { ensureTrainerCoachesMember } from './assignmentService.js';
import { ROLES } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { isValidId } from '../utils/validators.js';

/**
 * Shared business logic for WorkoutPlan and DietPlan services.
 *  - Trainers create plans and may only change / delete / assign their own plans.
 *  - Plans can only be assigned to members the trainer actively coaches.
 *  - Members may view only plans assigned to them; admins may view all.
 *
 * @param {object} cfg
 * @param {object} cfg.repository     plan repository
 * @param {string} cfg.label          human label, e.g. "Workout plan"
 * @param {string} cfg.entity         model name for audit records
 * @param {string} cfg.auditPrefix    e.g. "WORKOUT_PLAN"
 * @param {Function} cfg.validate     (body) => { errors, data }
 */
export default function createPlanService({ repository, label, entity, auditPrefix, validate }) {
  async function loadOwned(trainer, id) {
    if (!isValidId(id)) throw ApiError.badRequest(`Invalid ${label.toLowerCase()} id`);
    const plan = await repository.findById(id);
    if (!plan) throw ApiError.notFound(`${label} not found`);
    if (String(plan.trainer) !== String(trainer._id)) throw ApiError.forbidden(`You can only manage your own ${label.toLowerCase()}s`);
    return plan;
  }

  function validated(body) {
    const { errors, data } = validate(body || {});
    if (Object.keys(errors).length) throw ApiError.badRequest('Please correct the highlighted fields', errors);
    return data;
  }

  return {
    list(user, { search, level } = {}) {
      if (user.role === ROLES.ADMIN) return repository.findAll({ search });
      return repository.findByTrainer(user._id, { search, level });
    },

    async get(user, id) {
      if (!isValidId(id)) throw ApiError.badRequest(`Invalid ${label.toLowerCase()} id`);
      const plan = await repository.findByIdPopulated(id);
      if (!plan) throw ApiError.notFound(`${label} not found`);

      if (user.role === ROLES.TRAINER && String(plan.trainer._id) !== String(user._id)) {
        throw ApiError.forbidden(`You can only view your own ${label.toLowerCase()}s`);
      }
      if (user.role === ROLES.MEMBER) {
        const assigned = plan.assignedMembers.some((a) => String(a.member?._id) === String(user._id));
        if (!assigned) throw ApiError.forbidden(`This ${label.toLowerCase()} is not assigned to you`);
        const own = plan.toJSON();
        delete own.assignedMembers; // members never see who else follows the plan
        return own;
      }
      return plan;
    },

    async create(trainer, body, req) {
      const data = validated(body);
      const plan = await repository.create({ ...data, trainer: trainer._id });
      await auditService.record({
        actor: trainer,
        action: `${auditPrefix}_CREATED`,
        entity,
        entityId: plan._id,
        description: `${label} created: ${plan.title}`,
        req,
      });
      return plan;
    },

    async update(trainer, id, body, req) {
      await loadOwned(trainer, id);
      const data = validated(body);
      const plan = await repository.updateById(id, data);
      await auditService.record({
        actor: trainer,
        action: `${auditPrefix}_UPDATED`,
        entity,
        entityId: plan._id,
        description: `${label} updated: ${plan.title}`,
        req,
      });
      return repository.findByIdPopulated(id);
    },

    async remove(trainer, id, req) {
      const plan = await loadOwned(trainer, id);
      await repository.deleteById(id);
      await auditService.record({
        actor: trainer,
        action: `${auditPrefix}_DELETED`,
        entity,
        entityId: plan._id,
        description: `${label} deleted: ${plan.title}`,
        req,
      });
    },

    async assign(trainer, id, memberId, req) {
      const plan = await loadOwned(trainer, id);
      await ensureTrainerCoachesMember(trainer._id, memberId);
      if (plan.assignedMembers.some((a) => String(a.member) === String(memberId))) {
        throw ApiError.conflict(`This ${label.toLowerCase()} is already assigned to the member`);
      }
      await repository.addMember(id, memberId);
      await auditService.record({
        actor: trainer,
        action: `${auditPrefix}_ASSIGNED`,
        entity,
        entityId: plan._id,
        description: `${label} "${plan.title}" assigned to member ${memberId}`,
        req,
      });
      return repository.findByIdPopulated(id);
    },

    async unassign(trainer, id, memberId, req) {
      const plan = await loadOwned(trainer, id);
      if (!isValidId(memberId)) throw ApiError.badRequest('Invalid member id');
      if (!plan.assignedMembers.some((a) => String(a.member) === String(memberId))) {
        throw ApiError.notFound(`This ${label.toLowerCase()} is not assigned to the member`);
      }
      await repository.removeMember(id, memberId);
      await auditService.record({
        actor: trainer,
        action: `${auditPrefix}_UNASSIGNED`,
        entity,
        entityId: plan._id,
        description: `${label} "${plan.title}" unassigned from member ${memberId}`,
        req,
      });
      return repository.findByIdPopulated(id);
    },

    listForMember: (memberId) => repository.findAssignedToMember(memberId),
  };
}
