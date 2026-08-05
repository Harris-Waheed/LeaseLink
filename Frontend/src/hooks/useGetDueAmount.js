import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';

export function useGetDueAmount(tenantId) {
  return useQuery({
    queryKey: ['dueAmount', tenantId],
    queryFn: async () => {
      const res = await paymentService.getDueAmount(tenantId);
      return res.data?.data?.due_amount || 0;
    },
    enabled: !!tenantId
  });
}
