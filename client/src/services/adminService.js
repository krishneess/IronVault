import { api } from './api';

/** Membership tiers (public catalogue + admin management). */
export const tierService = {
  listPublic: () => api.get('/membership-tiers'),
  listAll: () => api.get('/membership-tiers/all'),
  create: (payload) => api.post('/membership-tiers', payload),
  update: (id, payload) => api.put(`/membership-tiers/${id}`, payload),
  setActive: (id, isActive) => api.patch(`/membership-tiers/${id}/status`, { isActive }),
  remove: (id) => api.delete(`/membership-tiers/${id}`),
};

/** Memberships – member self-service and admin subscription management. */
export const membershipService = {
  mine: () => api.get('/memberships/me'),
  selectPlan: (tierId) => api.post('/memberships/me', { tierId }),
  transition: (id, action, extra = {}) => api.post(`/memberships/${id}/transitions`, { action, ...extra }),
  list: (params) => api.get('/memberships', params),
  get: (id) => api.get(`/memberships/${id}`),
  createForMember: (memberId, tierId) => api.post('/memberships', { memberId, tierId }),
  summary: () => api.get('/memberships/summary'),
};

function accountApi(base) {
  return {
    list: (params) => api.get(base, params),
    get: (id) => api.get(`${base}/${id}`),
    create: (payload) => api.post(base, payload),
    update: (id, payload) => api.patch(`${base}/${id}`, payload),
    setActive: (id, isActive) => api.patch(`${base}/${id}/status`, { isActive }),
  };
}

export const adminMemberService = accountApi('/admin/members');
export const adminTrainerService = { ...accountApi('/admin/trainers'), options: () => api.get('/admin/trainers/options') };

export const assignmentAdminService = {
  assign: (memberId, trainerId, notes) => api.post('/assignments', { memberId, trainerId, notes }),
  end: (memberId) => api.delete(`/assignments/member/${memberId}`),
  list: (params) => api.get('/assignments', params),
};

export const reportService = {
  operational: (params) => api.get('/admin/reports/operational', params),
  auditLogs: (params) => api.get('/admin/audit-logs', params),
};
