import { api } from './api';

export const propertyService = {
  getAll: async () => api.get('/prop/get_prop'),
  getById: async (id) => api.get(`/prop/get_prop/${id}`),
  create: async (data) => api.post('/prop/add_property', data, { headers: { 'Content-Type': undefined } }),
  update: async (id, data) => api.put(`/prop/edit_prop/${id}`, data),
  delete: async (id) => api.delete(`/prop/status/${id}`)
};
