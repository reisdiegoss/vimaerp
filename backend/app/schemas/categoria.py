"""VimaERP 2.0 - Schemas: Categoria."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CategoriaBase(BaseModel):
    nome: str


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None


class CategoriaResponse(CategoriaBase):
    id: str # ULID de 26 caracteres
    tenant_id: str
    ativo: bool
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
