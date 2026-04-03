"""VimaERP 2.0 - Schemas: Pessoa (Cliente/Fornecedor)."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class PessoaBase(BaseModel):
    tipo: str  # cliente, fornecedor
    nome: str
    cpf_cnpj: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None


class PessoaCreate(PessoaBase):
    pass


class PessoaUpdate(BaseModel):
    tipo: Optional[str] = None
    nome: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    ativo: Optional[bool] = None


class PessoaResponse(PessoaBase):
    id: str
    tenant_id: str
    ativo: bool
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
