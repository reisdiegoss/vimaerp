import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEmpresaStore } from '@/store/empresaStore';

export interface Pessoa {
  id: string;
  codigo?: string;
  nome: string;
  tipo: 'cliente' | 'fornecedor';
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
}

export const usePessoas = (tipo?: string) => {
  const { activeFilial } = useEmpresaStore();

  return useQuery({
    queryKey: ['pessoas', activeFilial?.id, tipo],
    queryFn: async (): Promise<Pessoa[]> => {
      const params: Record<string, string> = { ativo: 'true' };
      if (tipo) params.tipo = tipo;

      const response = await api.get('/api/v1/pessoas', { params });
      return response.data;
    },
  });
};

export const useFornecedores = () => {
  return usePessoas('fornecedor');
};
