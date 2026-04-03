"""
VimaERP 2.0 - Controller: Produtos com Transações Atômicas e Grades.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
import ulid

from app.core.dependencies import get_db, get_current_user
from app.models.produto import Produto
from app.models.produto_variacao import ProdutoVariacao
from app.models.ficha_tecnica import FichaTecnica
from app.schemas.produto import ProdutoCreate, ProdutoUpdate, ProdutoResponse
from app.core.middleware import get_tenant_id, get_filial_id

router = APIRouter(prefix="/api/v1/produtos", tags=["Produtos"])

@router.get("/", response_model=list[ProdutoResponse])
async def listar_produtos(
    ativo: Optional[bool] = True,
    categoria_id: Optional[str] = None,
    tipo_produto: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Lista produtos da filial atual, com filtros e carregamento de unidade."""
    tenant_id = get_tenant_id()
    filial_id = get_filial_id()

    stmt = select(Produto).where(
        Produto.tenant_id == tenant_id,
        Produto.filial_id == filial_id
    ).options(joinedload(Produto.unidade_comercial))

    if ativo is not None:
        stmt = stmt.where(Produto.ativo == ativo)
    if categoria_id:
        stmt = stmt.where(Produto.categoria_id == categoria_id)
    if tipo_produto:
        stmt = stmt.where(Produto.tipo_produto == tipo_produto)
    if search:
        stmt = stmt.where(Produto.nome.ilike(f"%{search}%"))

    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    produtos = result.unique().scalars().all()
    
    return produtos


@router.get("/{produto_id}", response_model=ProdutoResponse)
async def buscar_produto(
    produto_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Busca um produto por ID (eager load habilitado nas variacoes/fichas via Model)."""
    produto = await Produto.find(produto_id, db=db)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto


@router.post("/", response_model=ProdutoResponse, status_code=201)
async def criar_produto(
    data: ProdutoCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Cria novo Produto de forma atômica (incluindo Grades e Custo/Receita)."""
    produto_data = data.model_dump(exclude={"variacoes", "ficha_tecnica"})
    produto = Produto(**produto_data)
    
    # Injetar tenant e filial explicitamente para garantir integridade no async
    from app.core.middleware import get_tenant_id, get_filial_id
    produto.tenant_id = get_tenant_id()
    produto.filial_id = get_filial_id()
    
    await produto.save(db=db)

    # Tratar Variações
    if data.variacoes and data.controla_grade:
        for var_data in data.variacoes:
            nova_variacao = ProdutoVariacao(
                id=str(ulid.ULID()),
                produto_pai_id=produto.id,
                tenant_id=produto.tenant_id,
                filial_id=produto.filial_id,
                **var_data.model_dump()
            )
            db.add(nova_variacao)

    # Tratar Ficha Técnica
    if data.ficha_tecnica and data.tipo_produto == "PRODUTO_ACABADO":
        for ft_data in data.ficha_tecnica:
            nova_ft = FichaTecnica(
                id=str(ulid.ULID()),
                produto_pai_id=produto.id,
                tenant_id=produto.tenant_id,
                filial_id=produto.filial_id,
                **ft_data.model_dump()
            )
            db.add(nova_ft)
            
    # Retornar recarregado para pegar as collections completas
    await db.refresh(produto)
    return produto


@router.put("/{produto_id}", response_model=ProdutoResponse)
async def atualizar_produto(
    produto_id: str,
    data: ProdutoUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Atualiza produto com SMART MERGE nas Variações Cartesianas."""
    produto = await Produto.find(produto_id, db=db)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Dados Básicos
    update_data = data.model_dump(exclude={"variacoes", "ficha_tecnica"}, exclude_unset=True)
    for field, value in update_data.items():
        setattr(produto, field, value)
        
    await produto.save(db=db)

    tenant_id = get_tenant_id()
    filial_id = get_filial_id()

    # SMART MERGE - Variações
    if data.variacoes is not None and produto.controla_grade:
        # 1. Obter Variações Existentes
        stmt = select(ProdutoVariacao).where(ProdutoVariacao.produto_pai_id == produto.id)
        result = await db.execute(stmt)
        existentes = result.scalars().all()
        
        # Helper: Mapear as existentes pelo dict JSON exato (serializado em string simplificada para dict index)
        # Mas como ditos não são hashables, usamos tupla de sort items.
        def get_attr_hash(attr_dict):
            if not attr_dict: return None
            return tuple(sorted(attr_dict.items()))
            
        mapa_existentes = {get_attr_hash(v.atributos): v for v in existentes if v.atributos}
        
        novas_submetidas = data.variacoes
        chaves_submetidas = set()
        
        for v_data in novas_submetidas:
            v_dict = v_data.model_dump(exclude_unset=True)
            v_attr = v_dict.get("atributos")
            v_hash = get_attr_hash(v_attr)
            
            if v_hash in mapa_existentes:
                # UPDATE
                var_existente = mapa_existentes[v_hash]
                # Mescla apenas os que foram explicitly alterados
                for k, v in v_dict.items():
                    if k not in ["id", "produto_pai_id"]:
                        setattr(var_existente, k, v)
                var_existente.ativo = True
                chaves_submetidas.add(v_hash)
            else:
                # INSERT (nova combinação criada pela grade)
                nova_var = ProdutoVariacao(
                    id=str(ulid.ULID()),
                    produto_pai_id=produto.id,
                    tenant_id=tenant_id,
                    filial_id=filial_id,
                    **v_dict
                )
                db.add(nova_var)
        
        # REMOVE as combinações que sumiram da matriz (Soft delete ou hard delete)
        # Faremos Soft delete desativando
        for v_hash, var_existente in mapa_existentes.items():
            if v_hash not in chaves_submetidas:
                var_existente.ativo = False

    # SMART MERGE - Ficha Técnica (Reconstrução simples para Ficha)
    if data.ficha_tecnica is not None and produto.tipo_produto == "PRODUTO_ACABADO":
        # Para Ficha técnica é mais seguro deletar a receita antiga e recriar as linhas passadas
        # ou usar Smart Merge por Materia Prima. Usaremos Smart Merge simples:
        stmt_ft = select(FichaTecnica).where(FichaTecnica.produto_pai_id == produto.id)
        res_ft = await db.execute(stmt_ft)
        fts_existentes = res_ft.scalars().all()
        
        # Dicionario por id de materia_prima
        mapa_ft = {ft.materia_prima_id: ft for ft in fts_existentes}
        enviados_ft = set()
        
        for ft_data in data.ficha_tecnica:
            ft_dict = ft_data.model_dump(exclude_unset=True)
            mat_id = ft_dict.get("materia_prima_id")
            enviados_ft.add(mat_id)
            
            if mat_id in mapa_ft:
                # Update
                mapa_ft[mat_id].quantidade_consumida = ft_dict.get("quantidade_consumida", 1.0)
            else:
                # Insert
                nova_ft = FichaTecnica(
                    id=str(ulid.ULID()),
                    produto_pai_id=produto.id,
                    tenant_id=tenant_id,
                    filial_id=filial_id,
                    materia_prima_id=mat_id,
                    quantidade_consumida=ft_dict.get("quantidade_consumida", 1.0)
                )
                db.add(nova_ft)
        
        # Hardware Delete dos ingredientes removidos da dieta/receita
        for mat_id, ft_existente in mapa_ft.items():
            if mat_id not in enviados_ft:
                await db.delete(ft_existente)

    # Pegar o objeto fresh para garantir que a resposta tenha id gerados e lazy lodados repletos
    await db.refresh(produto)
    return produto


@router.delete("/{produto_id}", status_code=204)
async def excluir_produto(
    produto_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Soft delete de um produto."""
    produto = await Produto.find(produto_id, db=db)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    from datetime import datetime
    produto.deleted_at = datetime.utcnow()
    produto.ativo = False
    await produto.save(db=db)
