import api from '@/lib/api';

export const TipoLancamento = {
  RECEITA: 'RECEITA',
  DESPESA: 'DESPESA'
} as const;

export type TipoLancamentoType = keyof typeof TipoLancamento;

export const StatusLancamento = {
  PENDENTE: 'PENDENTE',
  PAGO: 'PAGO',
  CANCELADO: 'CANCELADO',
  EM_PROCESSAMENTO: 'EM_PROCESSAMENTO',
  EM_DISPUTA: 'EM_DISPUTA'
} as const;

export type StatusLancamentoType = keyof typeof StatusLancamento;

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: TipoLancamentoType;
  cor?: string;
  icone?: string;
}

export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  tipo: string;
  saldo_inicial: number;
}

export interface LancamentoFinanceiro {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoLancamentoType;
  status: StatusLancamentoType;
  data_vencimento: string;
  data_pagamento?: string;
  categoria_id: string;
  conta_id: string;
  documento?: string;
  observacoes?: string;
  atrasado: boolean;
  categoria?: CategoriaFinanceira;
  conta?: ContaBancaria;
}

export interface CreateLancamentoDTO {
  descricao: string;
  valor: number;
  tipo: TipoLancamentoType;
  data_vencimento: string;
  categoria_id: string;
  conta_id: string;
  documento?: string;
  observacoes?: string;
}

export interface BaixaLancamentoDTO {
  data_pagamento: string;
  valor_pago?: number;
  conta_id?: string;
}

export const financeiroService = {
  // Lançamentos
  async getLancamentos(params?: Record<string, unknown>) {
    const response = await api.get<LancamentoFinanceiro[]>('/api/v1/financeiro/lancamentos', { params });
    return response.data;
  },

  async createLancamento(data: CreateLancamentoDTO) {
    const response = await api.post<LancamentoFinanceiro>('/api/v1/financeiro/lancamentos', data);
    return response.data;
  },

  async pagarLancamento(id: string, data: BaixaLancamentoDTO) {
    const response = await api.patch<LancamentoFinanceiro>(`/api/v1/financeiro/lancamentos/${id}/pagar`, data);
    return response.data;
  },

  async deleteLancamento(id: string) {
    await api.delete(`/api/v1/financeiro/lancamentos/${id}`);
  },

  // Contas Bancárias
  async getContasBancarias() {
    const response = await api.get<ContaBancaria[]>('/api/v1/financeiro/contas');
    return response.data;
  },

  async createContaBancaria(data: Partial<ContaBancaria>) {
    const response = await api.post<ContaBancaria>('/api/v1/financeiro/contas', data);
    return response.data;
  },

  // Categorias Financeiras
  async getCategorias() {
    const response = await api.get<CategoriaFinanceira[]>('/api/v1/financeiro/categorias');
    return response.data;
  },

  async createCategoria(data: Partial<CategoriaFinanceira>) {
    const response = await api.post<CategoriaFinanceira>('/api/v1/financeiro/categorias', data);
    return response.data;
  }
};
