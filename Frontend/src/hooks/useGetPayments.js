import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';

export function useGetPayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await paymentService.getAll();
      return res.data?.data || res.data || [];
    }
  });
}
