import api from '../lib/api';

export interface FilialUpdateDTO {
  prefixo_categoria?: string | null;
  prefixo_produto?: string | null;
  prefixo_pessoa?: string | null;
  prefixo_venda?: string | null;
  prefixo_os?: string | null;
}

export const filialService = {
  getFilial: async (filialId: string) => {
    const response = await api.get(`/api/v1/filiais/${filialId}`);
    return response.data;
  },
  updateFilial: async (filialId: string, data: FilialUpdateDTO) => {
    const response = await api.put(`/api/v1/filiais/${filialId}`, data);
    return response.data;
  },
};
