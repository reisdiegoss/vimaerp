"""
VimaERP 2.0 - Controller: Vendas (consulta).
Listagem e detalhamento de vendas já realizadas.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.venda import Venda
from app.schemas.venda import VendaResponse, VendaListResponse

router = APIRouter(prefix="/api/v1/vendas", tags=["Vendas"])


@router.get("/", response_model=list[VendaListResponse])
async def listar_vendas(
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Lista vendas da filial."""
    filters = {}
    if status:
        filters["status"] = status
    return await Venda.where(db=db, limit=limit, offset=offset, **filters)


@router.get("/{venda_id}", response_model=VendaResponse)
async def detalhar_venda(
    venda_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Retorna detalhes de uma venda com itens."""
    venda = await Venda.find(venda_id, db=db)
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda
