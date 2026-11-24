import { api } from './api';

export const authService = {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
};
