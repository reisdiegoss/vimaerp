"""
VimaERP 2.0 - API: Integracoes.
Gerenciamento das configurações de terceiros (Asaas, etc).
"""

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.cryptography import encrypt_value
from app.models.integracao import TenantIntegracao
from app.schemas.integracoes import IntegracaoAsaasCreate, IntegracaoAsaasResponse, IntegracaoStatus
from app.core.middleware import get_tenant_id

router = APIRouter(prefix="/api/v1/integracoes", tags=["Configurações"])

# URL base externa para webhooks
WEBHOOK_BASE_URL = "https://api.vimaerp.com.br/api/v1/webhooks/asaas"

@router.get("/asaas", response_model=IntegracaoStatus)
async def get_asaas_status(db: AsyncSession = Depends(get_db)):
    """Verifica o status da integração do Asaas para o Tenant atual."""
    tenant_id = get_tenant_id()
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Tenant não identificado")

    integracao = await TenantIntegracao.first(tenant_id=tenant_id, provedor="ASAAS")
    
    if not integracao:
        return {"is_integrated": False}

    response_data = IntegracaoAsaasResponse(
        id=integracao.id,
        tenant_id=integracao.tenant_id,
        provedor=integracao.provedor,
        ativo=integracao.ativo,
        webhook_token=integracao.webhook_token,
        webhook_url=WEBHOOK_BASE_URL,
        tem_api_key=bool(integracao.api_key)
    )
    
    return {"is_integrated": True, "details": response_data}

@router.post("/asaas", response_model=IntegracaoAsaasResponse)
async def upsert_asaas_integration(
    payload: IntegracaoAsaasCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Cria ou atualiza a integração do Asaas. Gera webhook_token dinamicamente."""
    tenant_id = get_tenant_id()
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Tenant não identificado")

    # Buscar integração existente
    integracao = await TenantIntegracao.first(tenant_id=tenant_id, provedor="ASAAS")

    if not integracao:
        integracao = TenantIntegracao(
            tenant_id=tenant_id,
            provedor="ASAAS",
            ativo=True
        )
    if not integracao.webhook_token or len(integracao.webhook_token) < 32:
        # Gerar o token de webhook único para este tenant
        integracao.webhook_token = f"vima_wh_{str(uuid.uuid4().hex)}"

    # Criptografar a API Key antes de salvar
    integracao.api_key = encrypt_value(payload.api_key)
    
    await integracao.save(db=db)

    return IntegracaoAsaasResponse(
        id=integracao.id,
        tenant_id=integracao.tenant_id,
        provedor=integracao.provedor,
        ativo=integracao.ativo,
        webhook_token=integracao.webhook_token,
        webhook_url=WEBHOOK_BASE_URL,
        tem_api_key=True
    )
