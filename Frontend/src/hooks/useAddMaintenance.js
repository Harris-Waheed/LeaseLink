import { useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../services/maintenanceService';

export function useAddMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // data should be { lease_id, issue_title, priority }
      const res = await maintenanceService.create(data);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch the maintenance tickets list
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
