import api from './axios';

export const purokApi = {
  getAll: () => api.get('/puroks'),
  getById: (id) => api.get(`/puroks/${id}`),
  create: (data) => api.post('/puroks', data),
  delete: (id) => api.delete(`/puroks/${id}`),
};