import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEmpresaStore } from '@/store/empresaStore';

export interface Variacao {
  id?: string;
  sku?: string;
  nome_variacao: string;
  atributos: Record<string, string | number | boolean>;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  ativo: boolean;
}

export interface FichaTecnicaItem {
  id?: string;
  materia_prima_id: string;
  quantidade_consumida: number;
  // Campos virtuais para UI
  nome?: string;
  unidade_sigla?: string;
}

export interface ProdutoList {
  id: string;
  codigo?: string;
  codigo_barras?: string;
  nome: string;
  tipo_produto: string;
  categoria_id: string;
  preco_venda: number;
  preco_custo: number;
  unidade_sigla?: string;
  ativo: boolean;
}

export interface ProdutoRead extends ProdutoList {
  nome_tecnico?: string;
  unidade_comercial_id?: string;
  unidade_tributaria_id?: string;
  fator_conversao: number;
  peso_bruto: number;
  peso_liquido: number;
  preco_minimo: number;
  margem_lucro?: number;
  ncm?: string;
  cest?: string;
  origem_mercadoria?: string;
  cfop_padrao?: string;
  estoque_minimo: number;
  estoque_maximo: number;
  localizacao_fisica?: string;
  altura: number;
  largura: number;
  comprimento: number;
  cross_docking_dias: number;
  descricao_detalhada?: string;
  link_video_youtube?: string;
  link_externo?: string;
  fornecedor_padrao_id?: string;
  codigo_referencia_fornecedor?: string;
  garantia_meses: number;
  controla_grade: boolean;
  variacoes?: Variacao[];
  ficha_tecnica?: FichaTecnicaItem[];
}

export const useProdutos = (search?: string, categoria_id?: string) => {
  const { activeFilial } = useEmpresaStore();

  return useQuery({
    queryKey: ['produtos', activeFilial?.id, search, categoria_id],
    queryFn: async (): Promise<ProdutoList[]> => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoria_id) params.categoria_id = categoria_id;

      const response = await api.get('/api/v1/produtos', { params });
      return response.data;
    },
  });
};

export const useInsumos = () => {
  const { activeFilial } = useEmpresaStore();

  return useQuery({
    queryKey: ['produtos', 'insumos', activeFilial?.id],
    queryFn: async (): Promise<ProdutoList[]> => {
      const params = { tipo_produto: 'MATERIA_PRIMA', ativo: 'true' };
      const response = await api.get('/api/v1/produtos', { params });
      return response.data;
    },
  });
};

export const useProduto = (id?: string | null) => {
  return useQuery({
    queryKey: ['produto', id],
    queryFn: async (): Promise<ProdutoRead | null> => {
      if (!id) return null;
      const response = await api.get(`/api/v1/produtos/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ProdutoRead>) => {
      const response = await api.post('/api/v1/produtos/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
};

export const useUpdateProduto = (id: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ProdutoRead>) => {
      if (!id) throw new Error('ID do produto não fornecido');
      const response = await api.put(`/api/v1/produtos/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produto', id] });
    },
  });
};
