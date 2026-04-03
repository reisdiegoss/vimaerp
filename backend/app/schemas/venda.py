"""VimaERP 2.0 - Schemas: Venda e PDV."""
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel


class VendaItemInput(BaseModel):
    """Item de venda enviado pelo PDV."""
    produto_id: str
    quantidade: int = 1
    preco_unitario: Decimal


class FecharVendaRequest(BaseModel):
    """Payload completo para fechar uma venda no PDV."""
    caixa_sessao_id: str
    pessoa_id: Optional[str] = None
    tipo_pagamento: str  # dinheiro, pix, cartao_credito, cartao_debito
    itens: List[VendaItemInput]


class VendaItemResponse(BaseModel):
    id: str
    produto_id: str
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    model_config = {"from_attributes": True}


class VendaResponse(BaseModel):
    id: str
    tenant_id: str
    filial_id: str
    caixa_sessao_id: str
    pessoa_id: Optional[str] = None
    origem: str
    total: Decimal
    status: str
    tipo_pagamento: Optional[str] = None
    itens: List[VendaItemResponse] = []
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class VendaListResponse(BaseModel):
    """Venda sem itens para listagem."""
    id: str
    total: Decimal
    status: str
    tipo_pagamento: Optional[str] = None
    origem: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
