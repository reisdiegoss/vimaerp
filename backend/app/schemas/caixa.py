"""VimaERP 2.0 - Schemas: Caixa/PDV."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AbrirCaixaRequest(BaseModel):
    saldo_inicial: int = 0  # centavos


class FecharCaixaRequest(BaseModel):
    saldo_final: int  # centavos


class CaixaSessaoResponse(BaseModel):
    id: str
    tenant_id: str
    filial_id: str
    usuario_id: str
    status: str
    saldo_inicial: int
    saldo_final: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
