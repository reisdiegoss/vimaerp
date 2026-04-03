import api from '../lib/api';

export interface IntegracaoAsaasResponse {
  id: string;
  tenant_id: string;
  provedor: string;
  ativo: boolean;
  webhook_token?: string;
  webhook_url: string;
  tem_api_key: boolean;
}

export interface IntegracaoStatus {
  is_integrated: boolean;
  details?: IntegracaoAsaasResponse;
}

export const integracaoService = {
  getAsaasStatus: async (): Promise<IntegracaoStatus> => {
    const response = await api.get<IntegracaoStatus>('/api/v1/integracoes/asaas');
    return response.data;
  },

  ativarAsaas: async (apiKey: string): Promise<IntegracaoAsaasResponse> => {
    const response = await api.post<IntegracaoAsaasResponse>('/api/v1/integracoes/asaas', {
      api_key: apiKey
    });
    return response.data;
  },
};
