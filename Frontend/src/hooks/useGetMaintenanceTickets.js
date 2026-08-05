import { useQuery } from '@tanstack/react-query';
import { maintenanceService } from '../services/maintenanceService';

export function useGetMaintenanceTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await maintenanceService.getAll();
      return res.data?.data || res.data || [];
    }
  });
}
