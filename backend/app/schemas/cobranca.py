"""VimaERP 2.0 - Schemas: Cobrança e Financeiro."""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class CobrancaCreate(BaseModel):
    venda_id: Optional[str] = None
    ordem_servico_id: Optional[str] = None
    valor: int  # centavos
    vencimento: date


class CobrancaResponse(BaseModel):
    id: str
    tenant_id: str
    filial_id: str
    venda_id: Optional[str] = None
    ordem_servico_id: Optional[str] = None
    asaas_charge_id: Optional[str] = None
    valor: int
    vencimento: date
    status: str
    link_pagamento: Optional[str] = None
    cliques: int = 0
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class AsaasWebhookPayload(BaseModel):
    """Payload do webhook do Asaas."""
    event: str
    payment: dict
