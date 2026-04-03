"""VimaERP 2.0 - Schemas: Estoque."""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class MovimentarEstoqueRequest(BaseModel):
    produto_id: str
    lote_id: Optional[str] = None
    tipo: str  # entrada, saida, ajuste
    quantidade: int
    observacao: Optional[str] = None

    @field_validator("lote_id", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        return None if v == "" else v


class EstoqueLoteResponse(BaseModel):
    id: str
    produto_id: str
    numero_lote: str
    quantidade: int
    data_validade: Optional[date] = None
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class MovimentacaoEstoqueResponse(BaseModel):
    id: str
    produto_id: str
    lote_id: Optional[str] = None
    tipo: str
    quantidade: int
    observacao: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
