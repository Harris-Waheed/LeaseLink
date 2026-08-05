import { useQuery } from '@tanstack/react-query';
import { propertyService } from '../services/propertyService';

export function useGetProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await propertyService.getAll();
      return res.data?.data || res.data || [];
    }
  });
}
