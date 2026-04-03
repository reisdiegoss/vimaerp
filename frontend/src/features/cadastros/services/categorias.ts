import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEmpresaStore } from '@/store/empresaStore';

export interface Categoria {
  id: string;
  codigo?: string;
  nome: string;
  ativo: boolean;
}

export const useCategorias = () => {
  const { activeFilial } = useEmpresaStore();
  
  return useQuery({
    queryKey: ['categorias', activeFilial?.id],
    queryFn: async (): Promise<Categoria[]> => {
      const response = await api.get('/api/v1/categorias');
      return response.data;
    },
  });
};

export const useCreateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Categoria, 'id'>) => {
      const response = await api.post('/api/v1/categorias', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
};

export const useUpdateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Categoria> }) => {
      const response = await api.put(`/api/v1/categorias/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
};
