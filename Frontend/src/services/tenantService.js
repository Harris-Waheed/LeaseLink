import { api } from './api';

export const tenantService = {
  getAll: async () => api.get('/tenant/all_tenants'),
  create: async (data) => api.post('/tenant/add_tenant', data),
  addTenant: async (data) => api.post('/tenant/add_tenant', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: async (id, data) => api.put(`/tenant/edit_tenant/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: async (id) => api.delete(`/tenant/delete/${id}`),
  updateStatus: async (id) => api.patch(`/tenant/status/${id}`),
  getPortalData: async (email) => api.get(`/tenants/portal/${email}`)
};
