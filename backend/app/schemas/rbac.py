"""VimaERP 2.0 - Schemas: RBAC (Roles & Permissions)."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class RoleResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    guard_name: str
    created_at: Optional[datetime] = None
    permissions: List["PermissionResponse"] = []

    model_config = {"from_attributes": True}


class PermissionResponse(BaseModel):
    id: str
    name: str
    guard_name: str
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# Resolver field validations (Self referencing)
RoleResponse.model_rebuild()


class RoleCreate(BaseModel):
    name: str
    permission_ids: List[str] = []  # Lista de IDs de permissões a vincular


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permission_ids: Optional[List[str]] = None


class UserSyncPermissionsRequest(BaseModel):
    user_id: str  # ULID do usuário
    role_id: Optional[str] = None  # Qual o perfil principal
    extra_permission_ids: List[str] = []  # Exceções (Permissões Custom)


class UserPermissionsResponse(BaseModel):
    user_id: str
    roles: List[str] = []
    permissions: List[str] = []
