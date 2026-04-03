"""
VimaERP 2.0 - Schemas Pydantic: Autenticação.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Payload de login: email + senha."""
    email: EmailStr
    password: str

class PingRequest(BaseModel):
    """Payload de heartbeat de conexão para estatísticas de usuários ativos."""
    filial_id: str


class TokenResponse(BaseModel):
    """Resposta do endpoint de login."""
    access_token: str
    token_type: str = "bearer"
    user: "UserBrief"


class UserBrief(BaseModel):
    """Resumo do usuário retornado no login e /me."""
    id: str  # ULID string
    tenant_id: str  # ULID string
    nome: str  # Campo real do banco
    email: str
    is_admin: bool
    dashboard_layout: Optional[list | dict] = None

    model_config = {"from_attributes": True}


# Resolver forward reference
TokenResponse.model_rebuild()
