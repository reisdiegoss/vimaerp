"""
VimaERP 2.0 - Schemas Pydantic: Filial.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FilialBase(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    ie: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    cep: Optional[str] = None
    
    # Prefixos
    prefixo_categoria: Optional[str] = None
    prefixo_produto: Optional[str] = None
    prefixo_pessoa: Optional[str] = None
    prefixo_venda: Optional[str] = None
    prefixo_os: Optional[str] = None


class FilialCreate(FilialBase):
    tenant_id: str  # ULID


class FilialUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    ie: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    cep: Optional[str] = None
    
    prefixo_categoria: Optional[str] = None
    prefixo_produto: Optional[str] = None
    prefixo_pessoa: Optional[str] = None
    prefixo_venda: Optional[str] = None
    prefixo_os: Optional[str] = None


class FilialResponse(FilialBase):
    id: str  # ULID
    tenant_id: str  # ULID
    ativo: bool
    email_contato: Optional[str] = None
    website: Optional[str] = None
    created_at: Optional[datetime] = None
    conectados: int = 0

    model_config = {"from_attributes": True}
