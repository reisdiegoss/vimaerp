"""
VimaERP 2.0 - Schemas Pydantic: User.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    nome: str  # Campo real do banco
    email: EmailStr


class UserCreate(UserBase):
    password: str
    tenant_id: str  # ULID


class UserResponse(UserBase):
    id: str  # ULID
    tenant_id: str  # ULID
    is_admin: bool = False  # Flag mock temporária (não mapeada no BD)
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
