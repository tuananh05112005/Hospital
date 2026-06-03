import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const usePatients = (page = 1, limit = 10, search = '') => {
  const { data: patients = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['patients', page, limit, search],
    queryFn: async () => {
      const response = await api.get(`/patients?page=${page}&limit=${limit}&search=${search}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { 
    patients, 
    loading, 
    error: error?.response?.data?.message || error?.message || null, 
    refetch 
  };
};
