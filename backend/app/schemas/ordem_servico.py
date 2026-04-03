"""VimaERP 2.0 - Schemas: Ordem de Serviço."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class OrdemServicoItemInput(BaseModel):
    produto_id: str
    quantidade: int = 1
    preco_unitario: int  # centavos


class OrdemServicoCreate(BaseModel):
    pessoa_id: str
    equipamento: Optional[str] = None
    defeito_relatado: Optional[str] = None
    itens: List[OrdemServicoItemInput] = []


class OrdemServicoUpdate(BaseModel):
    equipamento: Optional[str] = None
    defeito_relatado: Optional[str] = None
    laudo_tecnico: Optional[str] = None
    status: Optional[str] = None


class OrdemServicoItemResponse(BaseModel):
    id: str
    produto_id: str
    quantidade: int
    preco_unitario: int
    subtotal: int
    model_config = {"from_attributes": True}


class OrdemServicoResponse(BaseModel):
    id: str
    pessoa_id: str
    equipamento: Optional[str] = None
    defeito_relatado: Optional[str] = None
    laudo_tecnico: Optional[str] = None
    status: str
    total: int
    itens: List[OrdemServicoItemResponse] = []
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
