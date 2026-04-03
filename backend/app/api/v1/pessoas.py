"""
VimaERP 2.0 - Controller: Pessoas (Clientes/Fornecedores).
CRUD completo.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.pessoa import Pessoa
from app.schemas.pessoa import PessoaCreate, PessoaUpdate, PessoaResponse

router = APIRouter(prefix="/api/v1/pessoas", tags=["Pessoas"])


@router.get("/", response_model=list[PessoaResponse])
async def listar_pessoas(
    tipo: Optional[str] = None,
    ativo: Optional[bool] = True,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    filters = {}
    if tipo:
        filters["tipo"] = tipo
    if ativo is not None:
        filters["ativo"] = ativo
    return await Pessoa.where(db=db, limit=limit, offset=offset, **filters)


@router.get("/{pessoa_id}", response_model=PessoaResponse)
async def buscar_pessoa(
    pessoa_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    pessoa = await Pessoa.find(pessoa_id, db=db)
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    return pessoa


@router.post("/", response_model=PessoaResponse, status_code=201)
async def criar_pessoa(
    data: PessoaCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    pessoa = Pessoa(**data.model_dump())
    # Injetar tenant e filial
    from app.core.middleware import get_tenant_id, get_filial_id
    pessoa.tenant_id = get_tenant_id()
    pessoa.filial_id = get_filial_id()
    await pessoa.save(db=db)
    return pessoa


@router.put("/{pessoa_id}", response_model=PessoaResponse)
async def atualizar_pessoa(
    pessoa_id: str,
    data: PessoaUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    pessoa = await Pessoa.find(pessoa_id, db=db)
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pessoa, field, value)
    await pessoa.save(db=db)
    return pessoa


@router.delete("/{pessoa_id}", status_code=204)
async def excluir_pessoa(
    pessoa_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    pessoa = await Pessoa.find(pessoa_id, db=db)
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    from datetime import datetime
    pessoa.deleted_at = datetime.utcnow()
    pessoa.ativo = False
    await pessoa.save(db=db)
