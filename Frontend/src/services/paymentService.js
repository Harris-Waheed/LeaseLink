import { api } from './api';

export const paymentService = {
  getAll: async () => api.get('/pay/all_payments'),
  create: async (data) => api.post('/pay/log_payment', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDueAmount: async (tenantId) => api.get(`/pay/due_amount/${tenantId}`)
};
