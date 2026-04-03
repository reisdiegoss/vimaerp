"""
VimaERP 2.0 - Endpoints: Atributos de Grade.
Gerencia as definicoes de variantes (Cor, Tamanho, etc.) e vinculo com categorias.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.middleware import get_tenant_id, get_filial_id
from app.models.atributo_definicao import AtributoDefinicao
from app.models.categoria import Categoria
from pydantic import BaseModel
import ulid

from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/atributos", tags=["Admin/Grade"])

# Schemas
class AtributoCreate(BaseModel):
    nome: str
    valores_padrao: List[str] = []
    categoria_ids: List[str] = []

class AtributoRead(BaseModel):
    id: str
    nome: str
    slug: str
    valores_padrao: List[str] = []
    categoria_ids: List[str] = []
    categoria_nomes: List[str] = []

    class Config:
        from_attributes = True

@router.get("", response_model=List[AtributoRead])
async def list_atributos(
    db: AsyncSession = Depends(get_db)
):
    """Lista todas as definicoes de atributos do tenant com categorias carregadas."""
    from sqlalchemy import select
    
    stmt = select(AtributoDefinicao).options(selectinload(AtributoDefinicao.categorias))
    result = await db.execute(stmt)
    atributos = result.scalars().all()
    
    return [
        {
            "id": a.id,
            "nome": a.nome,
            "slug": a.slug,
            "valores_padrao": a.valores_padrao or [],
            "categoria_ids": [c.id for c in a.categorias],
            "categoria_nomes": [c.nome for c in a.categorias]
        } for a in atributos
    ]

@router.post("", response_model=AtributoRead)
async def create_atributo(
    data: AtributoCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Cria uma nova definicao de atributo e vincula a categorias."""
    import re
    from unicodedata import normalize
    from sqlalchemy.exc import IntegrityError
    
    # Log para Debug Profissional
    print(f"DEBUG: Criando Atributo - Tenant: {tenant_id}, Data: {data}")

    def slugify(text):
        text = normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
        text = re.sub(r'[^\w\s-]', '', text).strip().lower()
        return re.sub(r'[-\s]+', '-', text)

    try:
        atributo = AtributoDefinicao(
            id=str(ulid.ULID()),
            tenant_id=tenant_id,
            nome=data.nome,
            slug=slugify(data.nome),
            valores_padrao=data.valores_padrao or []
        )
        
        if data.categoria_ids:
            for cat_id in data.categoria_ids:
                categoria = await Categoria.find(cat_id, db=db)
                if categoria:
                    atributo.categorias.append(categoria)
        
        await atributo.save(db)
        await db.refresh(atributo, ["categorias"])
        
        return {
            "id": atributo.id,
            "nome": atributo.nome,
            "slug": atributo.slug,
            "valores_padrao": atributo.valores_padrao,
            "categoria_ids": [c.id for c in atributo.categorias],
            "categoria_nomes": [c.nome for c in atributo.categorias]
        }
    except IntegrityError as e:
        await db.rollback()
        print(f"ERROR: Integridade no Atributo - {str(e)}")
        raise HTTPException(status_code=400, detail="Erro de integridade relacional. Verifique duplicados.")
    except Exception as e:
        await db.rollback()
        print(f"ERROR: Falha inesperada no Atributo - {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=AtributoRead)
async def update_atributo(
    id: str,
    data: AtributoCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """Atualiza um atributo existente e seus vínculos."""
    from sqlalchemy.exc import IntegrityError
    atributo = await AtributoDefinicao.find(id, db=db)
    if not atributo:
        raise HTTPException(status_code=404, detail="Atributo nao encontrado")
    
    import re
    from unicodedata import normalize
    def slugify(text):
        text = normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
        text = re.sub(r'[^\w\s-]', '', text).strip().lower()
        return re.sub(r'[-\s]+', '-', text)

    try:
        atributo.nome = data.nome
        atributo.slug = slugify(data.nome)
        atributo.valores_padrao = data.valores_padrao or []
        
        await db.refresh(atributo, ["categorias"])
        atributo.categorias = []
        
        if data.categoria_ids:
            for cat_id in data.categoria_ids:
                categoria = await Categoria.find(db, cat_id)
                if categoria:
                    atributo.categorias.append(categoria)
        
        await atributo.save(db)
        await db.refresh(atributo, ["categorias"])
        
        return {
            "id": atributo.id,
            "nome": atributo.nome,
            "slug": atributo.slug,
            "valores_padrao": atributo.valores_padrao,
            "categoria_ids": [c.id for c in atributo.categorias],
            "categoria_nomes": [c.nome for c in atributo.categorias]
        }
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Erro de integridade ao atualizar.")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_atributo(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """Remove um atributo."""
    atributo = await AtributoDefinicao.find(id, db=db)
    if not atributo:
        raise HTTPException(status_code=404, detail="Atributo nao encontrado")
    
    await db.delete(atributo)
    await db.commit()
    return {"message": "Atributo removido com sucesso"}

@router.get("/por-categoria/{categoria_id}", response_model=List[AtributoRead])
async def get_atributos_por_categoria(
    categoria_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retorna os atributos permitidos para uma categoria especifica + atributos Globais."""
    from sqlalchemy import select
    
    categoria = await db.get(
        Categoria, 
        categoria_id, 
        options=[
            selectinload(Categoria.atributos_permitidos).selectinload(AtributoDefinicao.categorias)
        ]
    )
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria nao encontrada")
    
    atributos_especificos = categoria.atributos_permitidos
    
    import sqlalchemy as sa
    from app.models.atributo_definicao import categoria_atributos
    subquery = sa.select(categoria_atributos.c.atributo_definicao_id)
    
    # Busca globais com categorias pré-carregadas
    stmt_globais = select(AtributoDefinicao).where(
        AtributoDefinicao.id.not_in(subquery)
    ).options(selectinload(AtributoDefinicao.categorias))
    
    result_globais = await db.execute(stmt_globais)
    atributos_globais = result_globais.scalars().all()
    
    todos = list(atributos_especificos) + list(atributos_globais)
    
    vistos = set()
    resultado = []
    for a in todos:
        if a.id not in vistos:
            resultado.append({
                "id": a.id,
                "nome": a.nome,
                "slug": a.slug,
                "valores_padrao": a.valores_padrao or [],
                "categoria_ids": [c.id for c in a.categorias],
                "categoria_nomes": [c.nome for c in a.categorias]
            })
            vistos.add(a.id)
            
    return resultado
