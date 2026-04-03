"""
VimaERP 2.0 - Controller: Categorias.
CRUD completo.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaResponse

router = APIRouter(prefix="/api/v1/categorias", tags=["Categorias"])


@router.get("/", response_model=list[CategoriaResponse])
async def listar_categorias(
    ativo: Optional[bool] = True,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    filters = {}
    if ativo is not None:
        filters["ativo"] = ativo
    return await Categoria.where(db=db, limit=limit, offset=offset, **filters)


@router.get("/{categoria_id}", response_model=CategoriaResponse)
async def buscar_categoria(
    categoria_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    cat = await Categoria.find(categoria_id, db=db)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return cat


@router.post("/", response_model=CategoriaResponse, status_code=201)
async def criar_categoria(
    data: CategoriaCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    cat = Categoria(**data.model_dump())
    await cat.save(db=db)
    return cat


@router.put("/{categoria_id}", response_model=CategoriaResponse)
async def atualizar_categoria(
    categoria_id: str,
    data: CategoriaUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    cat = await Categoria.find(categoria_id, db=db)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    await cat.save(db=db)
    return cat


@router.delete("/{categoria_id}", status_code=204)
async def excluir_categoria(
    categoria_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    cat = await Categoria.find(categoria_id, db=db)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    from datetime import datetime
    cat.deleted_at = datetime.utcnow()
    cat.ativo = False
    await cat.save(db=db)
