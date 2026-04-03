"""
VimaERP 2.0 - Controller: Filiais.

Gerenciamento de Multi-Empresas (CNPJ) por Tenant.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ulid import ULID

from app.core.dependencies import get_db, get_current_user
from app.models.filial import Filial
from app.models.user import User
from app.schemas.filial import FilialCreate, FilialResponse, FilialUpdate

router = APIRouter(prefix="/filiais", tags=["Filiais / Multi-Empresa"])


@router.post("/", response_model=FilialResponse, status_code=status.HTTP_201_CREATED)
async def criar_filial(
    filial_in: FilialCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Cria uma nova filial (CNPJ base) atrelada ao respectivo Tenant.
    E automaticamente vincula o usuário criador a esta filial.
    Se o usuário não enviar 'tenant_id' no JSON, injetamos.
    """
    # Override de tenant_id com o do criador (isolation/safety)
    filial_dict = filial_in.model_dump()
    filial_dict["tenant_id"] = user.tenant_id
    filial_dict["id"] = str(ULID())
    filial_dict["ativo"] = True
    
    nova_filial = Filial(**filial_dict)
    
    # Vincula o criador (dono/admin) à filial (tabela associativa filial_user)
    nova_filial.users.append(user)

    db.add(nova_filial)
    try:
        await db.commit()
        await db.refresh(nova_filial)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao cadastrar Unidade/Filial: {e}",
        )
        
    return nova_filial

@router.get("/{filial_id}", response_model=FilialResponse)
async def ler_filial(
    filial_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Retorna os dados de uma filial garantindo o isolamento do tenant.
    """
    result = await db.execute(
        Filial.__table__.select().where(
            (Filial.id == filial_id) & (Filial.tenant_id == user.tenant_id)
        )
    )
    filial = result.fetchone()
    
    if not filial:
        raise HTTPException(status_code=404, detail="Filial não encontrada ou sem permissão.")

    return filial

@router.put("/{filial_id}", response_model=FilialResponse)
async def atualizar_filial(
    filial_id: str,
    filial_in: FilialUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Atualiza os dados e configurações de uma filial existente.
    Apenas usuários atrelados ao mesmo tenant podem realizar atualização.
    """
    # 1. Busca a filial garantindo o isolamento do tenant
    result = await db.execute(
        Filial.__table__.select().where(
            (Filial.id == filial_id) & (Filial.tenant_id == user.tenant_id)
        )
    )
    filial_atual = result.fetchone()
    
    if not filial_atual:
        raise HTTPException(status_code=404, detail="Filial não encontrada ou sem permissão.")

    # 2. Resgata o objeto via Modelo
    filial = await db.get(Filial, filial_id)
    
    if not filial:
        raise HTTPException(status_code=404, detail="Filial não encontrada.")

    # 3. Atualiza os campos enviados
    update_data = filial_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(filial, field, value)

    db.add(filial)
    try:
        await db.commit()
        await db.refresh(filial)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar Filial: {e}")

    return filial
