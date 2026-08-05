import { useQuery } from '@tanstack/react-query';
import { leaseService } from '../services/leaseService';

export function useGetLeases() {
  return useQuery({
    queryKey: ['leases'],
    queryFn: async () => {
      const res = await leaseService.getAll();
      return res.data?.data || res.data || [];
    }
  });
}
