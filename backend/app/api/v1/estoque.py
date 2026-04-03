"""
VimaERP 2.0 - Controller: Estoque.
Consulta de lotes e movimentação.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.estoque_lote import EstoqueLote
from app.models.movimentacao_estoque import MovimentacaoEstoque
from app.schemas.estoque import (
    MovimentarEstoqueRequest,
    EstoqueLoteResponse,
    MovimentacaoEstoqueResponse,
)
from app.services.estoque_service import EstoqueService

router = APIRouter(prefix="/api/v1/estoque", tags=["Estoque"])


@router.get("/lotes", response_model=list[EstoqueLoteResponse])
async def listar_lotes(
    produto_id: str = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Lista lotes de estoque, opcionalmente filtrados por produto."""
    filters = {}
    if produto_id:
        filters["produto_id"] = produto_id
    return await EstoqueLote.where(db=db, limit=limit, offset=offset, **filters)


@router.get("/movimentacoes", response_model=list[MovimentacaoEstoqueResponse])
async def listar_movimentacoes(
    produto_id: str = None,
    tipo: str = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Lista movimentações de estoque."""
    filters = {}
    if produto_id:
        filters["produto_id"] = produto_id
    if tipo:
        filters["tipo"] = tipo
    return await MovimentacaoEstoque.where(db=db, limit=limit, offset=offset, **filters)


@router.post("/movimentar", response_model=MovimentacaoEstoqueResponse, status_code=201)
async def movimentar_estoque(
    data: MovimentarEstoqueRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Registra uma movimentação de estoque (entrada, saída ou ajuste)."""
    mov = await EstoqueService.movimentar(
        db=db,
        usuario_id=user.id,
        data=data,
    )
    return mov
