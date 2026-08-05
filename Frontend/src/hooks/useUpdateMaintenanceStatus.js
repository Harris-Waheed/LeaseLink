import { useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../services/maintenanceService';

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await maintenanceService.updateStatus(id, status);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch the maintenance tickets list
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
