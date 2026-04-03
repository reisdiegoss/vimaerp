"""
VimaERP 2.0 - Schemas: TenantIntegracao.
Validação de dados para ativação e consulta de integrações.
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict

class IntegracaoAsaasBase(BaseModel):
    provedor: str = "ASAAS"

class IntegracaoAsaasCreate(IntegracaoAsaasBase):
    api_key: str

class IntegracaoAsaasResponse(IntegracaoAsaasBase):
    id: str
    tenant_id: str
    ativo: bool
    webhook_token: Optional[str] = None
    webhook_url: str  # URL gerada dinamicamente pelo backend
    
    # Campo para indicar se a chave de API está configurada (sem revelá-la)
    tem_api_key: bool = False

    model_config = ConfigDict(from_attributes=True)

class IntegracaoStatus(BaseModel):
    is_integrated: bool
    details: Optional[IntegracaoAsaasResponse] = None
