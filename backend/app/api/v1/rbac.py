"""
VimaERP 2.0 - Controller: RBAC (Roles & Permissions).
Gerenciamento de papéis e permissões.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_db, get_current_user
from app.models.rbac import Role, Permission
from app.schemas.rbac import (
    RoleResponse,
    PermissionResponse,
    UserPermissionsResponse,
    RoleCreate,
    RoleUpdate,
    UserSyncPermissionsRequest,
)
from app.services.rbac_service import RbacService

router = APIRouter(prefix="/rbac", tags=["RBAC"])


@router.get("/roles", response_model=list[RoleResponse])
async def listar_roles(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Lista os Roles disponiveis para aquele Tenant.
    """
    stmt = select(Role).where(Role.tenant_id == user.tenant_id)
    result = await db.execute(stmt)
    roles = result.scalars().all()
    # Pydantic converte a lista, e 'permissions' é auto-resolvido pelo schema (lazy load ou in-memory).
    return roles


@router.post("/roles", response_model=dict)
async def criar_role(
    payload: RoleCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Cria um novo Role atrelado a este Tenant."""
    try:
        new_id = await RbacService.create_role(
            db=db,
            tenant_id=user.tenant_id,
            name=payload.name,
            permission_ids=payload.permission_ids,
        )
        return {"status": "ok", "role_id": new_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/roles/{role_id}", response_model=dict)
async def atualizar_role(
    role_id: str,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Atualiza dados e permissões de um Role do Tenant."""
    try:
        await RbacService.update_role(
            db=db,
            role_id=role_id,
            tenant_id=user.tenant_id,
            name=payload.name,
            permission_ids=payload.permission_ids,
        )
        return {"status": "ok", "message": "Role atualizado com sucesso"}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/permissions", response_model=list[PermissionResponse])
async def listar_permissions(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Lista todas as permissions do sistema (São globais)."""
    return await Permission.all(db=db, limit=500)





@router.post("/user/{target_user_id}/sync_permissions", status_code=200)
async def sync_user_permissions(
    target_user_id: str,
    payload: UserSyncPermissionsRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Limpa e recria o vínculo de Perfil Principal + Permissões Extras 
    do usuário alvo. Deve garantir que o target_user pertence ao Tenant.
    """
    from app.models.user import User
    # Verifica parentesco
    target = await db.execute(select(User).where(User.id == target_user_id, User.tenant_id == user.tenant_id))
    if not target.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Usuário não encontrado no Tenant.")

    try:
        await RbacService.sync_user_permissions(
            db=db,
            user_id=target_user_id,
            role_id=payload.role_id,
            extra_permission_ids=payload.extra_permission_ids
        )
        return {"status": "ok", "message": "Permissões de usuário sincronizadas"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/user/{user_id}/permissions", response_model=UserPermissionsResponse)
async def permissoes_do_usuario(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Retorna todas as roles e permissions de um usuário."""
    return await RbacService.get_user_permissions(db=db, user_id=user_id)
