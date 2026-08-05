import { api } from './api';

export const leaseService = {
  getAll: async () => api.get('/lease/all_leases'),
  create: async (data) => api.post('/lease/add_lease', data),
  addLease: async (data) => api.post('/lease/add_lease', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: async (id, data) => api.put(`/lease/edit_lease/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: async (id) => api.patch(`/lease/status/${id}`)
};
