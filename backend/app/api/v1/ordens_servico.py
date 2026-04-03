"""
VimaERP 2.0 - Controller: Ordens de Serviço.
CRUD completo com itens aninhados.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.ordem_servico import OrdemServico
from app.models.ordem_servico_item import OrdemServicoItem
from app.schemas.ordem_servico import (
    OrdemServicoCreate,
    OrdemServicoUpdate,
    OrdemServicoResponse,
)
from app.core.middleware import get_filial_id  # noqa: F401

from ulid import ULID

router = APIRouter(prefix="/api/v1/ordens-servico", tags=["Ordens de Serviço"])


@router.get("/", response_model=list[OrdemServicoResponse])
async def listar_os(
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    filters = {}
    if status:
        filters["status"] = status
    return await OrdemServico.where(db=db, limit=limit, offset=offset, **filters)


@router.get("/{os_id}", response_model=OrdemServicoResponse)
async def buscar_os(
    os_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    os_obj = await OrdemServico.find(os_id, db=db)
    if not os_obj:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    return os_obj


@router.post("/", response_model=OrdemServicoResponse, status_code=201)
async def criar_os(
    data: OrdemServicoCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Cria OS com itens (se enviados)."""
    os_id = str(ULID())
    total = 0

    os_obj = OrdemServico(
        id=os_id,
        pessoa_id=data.pessoa_id,
        equipamento=data.equipamento,
        defeito_relatado=data.defeito_relatado,
    )

    for item_data in data.itens:
        subtotal = item_data.quantidade * item_data.preco_unitario
        total += subtotal
        item = OrdemServicoItem(
            id=str(ULID()),
            ordem_servico_id=os_id,
            produto_id=item_data.produto_id,
            quantidade=item_data.quantidade,
            preco_unitario=item_data.preco_unitario,
            subtotal=subtotal,
        )
        db.add(item)

    os_obj.total = total
    await os_obj.save(db=db)
    await db.commit()

    return await OrdemServico.find(os_id, db=db)


@router.put("/{os_id}", response_model=OrdemServicoResponse)
async def atualizar_os(
    os_id: str,
    data: OrdemServicoUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    os_obj = await OrdemServico.find(os_id, db=db)
    if not os_obj:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(os_obj, field, value)
    await os_obj.save(db=db)
    return os_obj


@router.delete("/{os_id}", status_code=204)
async def excluir_os(
    os_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    os_obj = await OrdemServico.find(os_id, db=db)
    if not os_obj:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    from datetime import datetime
    os_obj.deleted_at = datetime.utcnow()
    await os_obj.save(db=db)
