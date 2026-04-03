"""
VimaERP 2.0 - Schemas Pydantic: Tenant.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TenantBase(BaseModel):
    nome: str
    documento: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantResponse(TenantBase):
    id: str  # ULID
    ativo: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
