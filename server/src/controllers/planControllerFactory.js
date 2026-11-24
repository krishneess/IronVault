import { sendSuccess } from '../utils/apiResponse.js';

/** HTTP handlers shared by the Workout Plan and Diet Plan controllers. */
export default function createPlanController(service, label) {
  return {
    async list(req, res) {
      const plans = await service.list(req.user, { search: req.query.search, level: req.query.level });
      sendSuccess(res, { message: `${label}s`, data: plans, meta: { total: plans.length } });
    },
    async get(req, res) {
      const plan = await service.get(req.user, req.params.id);
      sendSuccess(res, { message: label, data: plan });
    },
    async create(req, res) {
      const plan = await service.create(req.user, req.body, req);
      sendSuccess(res, { statusCode: 201, message: `${label} created successfully`, data: plan });
    },
    async update(req, res) {
      const plan = await service.update(req.user, req.params.id, req.body, req);
      sendSuccess(res, { message: `${label} updated successfully`, data: plan });
    },
    async remove(req, res) {
      await service.remove(req.user, req.params.id, req);
      sendSuccess(res, { message: `${label} deleted` });
    },
    async assign(req, res) {
      const plan = await service.assign(req.user, req.params.id, req.body?.memberId, req);
      sendSuccess(res, { message: `${label} assigned to member`, data: plan });
    },
    async unassign(req, res) {
      const plan = await service.unassign(req.user, req.params.id, req.params.memberId, req);
      sendSuccess(res, { message: `${label} unassigned from member`, data: plan });
    },
  };
}
