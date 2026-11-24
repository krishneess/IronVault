import { api } from './api';

export const dashboardService = {
  admin: () => api.get('/dashboard/admin'),
  trainer: () => api.get('/dashboard/trainer'),
  member: () => api.get('/dashboard/member'),
};
