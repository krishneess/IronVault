import { api } from './api';

/** Member profile, trainer, plans and fitness records (member role). */
export const memberService = {
  profile: () => api.get('/members/me'),
  updateProfile: (payload) => api.patch('/members/me', payload),
  trainer: () => api.get('/members/me/trainer'),
  plans: () => api.get('/members/me/plans'),
};

/** Trainer profile and assigned members (trainer role). */
export const trainerService = {
  profile: () => api.get('/trainers/me'),
  updateProfile: (payload) => api.patch('/trainers/me', payload),
  members: (search) => api.get('/trainers/me/members', { search }),
  member: (memberId) => api.get(`/trainers/me/members/${memberId}`),
  memberProgress: (memberId, params) => api.get(`/trainers/me/members/${memberId}/progress`, params),
};

function planApi(base) {
  return {
    list: (params) => api.get(base, params),
    get: (id) => api.get(`${base}/${id}`),
    create: (payload) => api.post(base, payload),
    update: (id, payload) => api.put(`${base}/${id}`, payload),
    remove: (id) => api.delete(`${base}/${id}`),
    assign: (id, memberId) => api.post(`${base}/${id}/assignments`, { memberId }),
    unassign: (id, memberId) => api.delete(`${base}/${id}/assignments/${memberId}`),
  };
}

export const workoutPlanService = planApi('/workout-plans');
export const dietPlanService = planApi('/diet-plans');

export const fitnessRecordService = {
  list: (params) => api.get('/fitness-records', params),
  summary: () => api.get('/fitness-records/summary'),
  create: (payload) => api.post('/fitness-records', payload),
  update: (id, payload) => api.put(`/fitness-records/${id}`, payload),
  remove: (id) => api.delete(`/fitness-records/${id}`),
};
