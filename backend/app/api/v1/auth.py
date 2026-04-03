"""
VimaERP 2.0 - Controller: Autenticação.

Endpoints:
    POST /api/v1/auth/login  → Recebe email+senha, retorna JWT
    GET  /api/v1/auth/me     → Retorna dados do usuário logado
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.core.redis import track_user_activity
from app.models.user import User
from app.models.filial import Filial
from app.schemas.auth import LoginRequest, TokenResponse, UserBrief, PingRequest
from app.schemas.filial import FilialResponse

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Autentica o usuário com email e senha.
    Retorna um JWT com tenant_id e user_id embutidos.
    """
    # Buscar usuário pelo email (sem filtro de tenant — login é global)
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos.",
        )

    # Gerar JWT com dados do tenant
    token = create_access_token(
        data={
            "user_id": user.id,
            "tenant_id": user.tenant_id,
            "email": user.email,
        }
    )

    return TokenResponse(
        access_token=token,
        user=UserBrief.model_validate(user),
    )


@router.get("/me", response_model=UserBrief)
async def me(user: User = Depends(get_current_user)):
    """Retorna os dados do usuário logado (extraído do JWT)."""
    return UserBrief.model_validate(user)


@router.post("/ping")
async def ping(
    payload: PingRequest,
    user: User = Depends(get_current_user),
):
    """
    Heartbeat para registrar que o usuário está conectado em determinada filial.
    Atualiza o Redis para rastrear ativos.
    """
    await track_user_activity(user.tenant_id, payload.filial_id, user.id)
    return {"status": "ok"}


@router.get("/filiais", response_model=list[FilialResponse])
async def minhas_filiais(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Retorna a lista de filiais que o usuário tem acesso.
    Por enquanto, retorna todas as filiais ativas pertencentes ao mesmo Tenant do usuário.
    """
    from app.core.redis import get_active_users_count

    stmt = select(Filial).where(Filial.tenant_id == user.tenant_id, Filial.ativo == True)
    result = await db.execute(stmt)
    filiais = result.scalars().all()
    
    response_list = []
    for f in filiais:
        count = await get_active_users_count(user.tenant_id, f.id)
        f_dict = FilialResponse.model_validate(f).model_dump()
        f_dict["conectados"] = count
        response_list.append(f_dict)

    return response_list


from fastapi import Body

@router.patch("/layout")
async def atualizar_layout(
    payload: list | dict = Body(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Atualiza as preferências de layout da dashboard do usuário."""
    user.dashboard_layout = payload
    await db.commit()
    return {"status": "ok", "layout": user.dashboard_layout}
