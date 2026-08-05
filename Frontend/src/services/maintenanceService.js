import { api } from './api';

export const maintenanceService = {
  getAll: async () => api.get('/maintain/all_maintenance'),
  create: async (data) => api.post('/maintain/add_maintenance', data),
  updateStatus: async (id, status) => api.patch(`/maintain/update_maintenance_status`, { request_id: id, status }),
  delete: async (requestId) => api.delete(`/maintain/delete_maintenance_request/${requestId}`)
};
