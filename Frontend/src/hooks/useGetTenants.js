import { useQuery } from '@tanstack/react-query';
import { tenantService } from '../services/tenantService';

export function useGetTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await tenantService.getAll();
      return res.data?.data || res.data || [];
    }
  });
}
