import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useGetActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await api.get('/dashboard/dashboard_activities');
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        return res.data.data.map((item, idx) => ({
          id: idx,
          type: item.activity_type ? item.activity_type.toLowerCase() : 'tenant',
          message: item.description,
          time: new Date(item.activity_date || item.date).toLocaleDateString(),
          rawTime: new Date(item.activity_date || item.date)
        }));
      }
      return [];
    }
  });
}
