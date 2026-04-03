"""
VimaERP 2.0 - Usuários (RBAC / Filiais)
Retorna usuários pertencentes apenas ao Tenant do usuário atual autenticado.
Somente usuários com is_admin = True devem ter permissão total nas rotas de criação/edição.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password
from app.models.user import User
from app.models.filial import Filial
from app.models.rbac import filial_user
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["Users"])

# --- Schemas internos temporários (Idealmente mover para schemas/user.py) ---
class UserCreateRequest(BaseModel):
    nome: str
    email: EmailStr
    password: str
    role_id: str
    extra_permission_ids: List[str] = []
    filiais_ids: List[str]

class UserListResponse(BaseModel):
    id: str
    nome: str
    email: EmailStr
    is_admin: bool
    role: str
    filiais: List[str]  # Lista de Nomes ou IDs
    
    model_config = {"from_attributes": True}


@router.get("/", response_model=List[UserListResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista usuários do mesmo Tenant. Retorna papéis e filiais."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado: Requer privilégio de administrador.")

    stmt = select(User).where(User.tenant_id == current_user.tenant_id)
    result = await db.execute(stmt)
    users = result.scalars().all()

    response = []
    for u in users:
        # Mock do role por enquanto baseado no is_admin
        role_mock = "admin" if u.is_admin else "vendedor"
        
        # Buscar filiais
        fil_stmt = select(Filial).join(filial_user).where(filial_user.c.user_id == u.id)
        fil_result = await db.execute(fil_stmt)
        filiais = fil_result.scalars().all()
        
        response.append({
            "id": u.id,
            "nome": u.nome,
            "email": u.email,
            "is_admin": u.is_admin,
            "role": role_mock,
            "filiais": [f.nome for f in filiais]
        })

    return response


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cria um usuário, atribuindo filiais e papéis."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar usuários.")

    # Verifica se e-mail já existe
    stmt = select(User).where(User.email == data.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado no sistema.")

    # 1. Cria usuário base
    new_user = User(
        nome=data.nome,
        email=data.email,
        password=hash_password(data.password),
        tenant_id=current_user.tenant_id,
        is_admin=False # Permissões agora ditam o controle
    )
    db.add(new_user)
    await db.flush()  # Para obter o new_user.id
    
    # 2. Vincular Perfil e Permissões Extras (RBAC)
    from app.services.rbac_service import RbacService
    await RbacService.sync_user_permissions(
        db=db,
        user_id=new_user.id,
        role_id=data.role_id,
        extra_permission_ids=data.extra_permission_ids
    )

    # 3. Associa as Filiais (many-to-many filial_user)
    if data.filiais_ids:
        for f_id in data.filiais_ids:
            stmt_insert = filial_user.insert().values(filial_id=f_id, user_id=new_user.id)
            await db.execute(stmt_insert)

    await db.commit()
    return {"message": "Usuário criado com sucesso!"}
