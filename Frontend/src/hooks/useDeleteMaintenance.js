import { useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../services/maintenanceService';
import toast from 'react-hot-toast';

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId) => maintenanceService.delete(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error) => {
      console.error('Error deleting maintenance request:', error);
      toast.error('Failed to delete maintenance request.');
    }
  });
}
