from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import Optional
from app.core.database import get_db
from app.services.fiscal_service import FiscalService
from app.models.fiscal import FiscalNcm, FiscalCest, FiscalCfop
import os
import shutil
import tempfile
import json
import pandas as pd
import io

router = APIRouter(prefix="/api/v1/fiscal", tags=["Fiscal (NCM/CEST/CFOP)"])

@router.post("/colunas")
async def obter_colunas(file: UploadFile = File(...)):
    """Extrai os nomes das colunas de um arquivo XLSX, XLS ou CSV."""
    ext = file.filename.split('.')[-1].lower()
    content = await file.read()
    
    try:
        if ext == "csv":
            # Lê apenas o header para ser rápido
            df = pd.read_csv(io.BytesIO(content), nrows=0, sep=None, engine='python')
        else:
            # Excel não suporta nrows=0 de forma eficiente em algumas versões, mas lemos o mínimo
            df = pd.read_excel(io.BytesIO(content), nrows=0)
            
        return {"colunas": list(df.columns)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler colunas do arquivo: {str(e)}")

@router.post("/importar")
async def importar_fiscal(
    file: UploadFile = File(...),
    tipo: str = Query(..., description="NCM, CEST ou CFOP"),
    mapeamento: str = Query(..., description="JSON string do mapeamento de colunas"),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint universal de importação com mapeamento dinâmico.
    Suporta XLSX, XLS e CSV.
    """
    ext = file.filename.split('.')[-1].lower()
    content = await file.read()
    
    try:
        mapping_dict = json.loads(mapeamento)
    except Exception:
        raise HTTPException(status_code=400, detail="Mapeamento inválido. Deve ser um JSON string.")

    result = await FiscalService.processar_importacao(content, ext, tipo, mapping_dict)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.get("/ncm/search")
async def search_ncm(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db)
):
    """Busca NCM por código ou descrição para autocomplete."""
    stmt = select(FiscalNcm).where(
        or_(
            FiscalNcm.codigo.ilike(f"%{q}%"),
            FiscalNcm.descricao.ilike(f"%{q}%")
        )
    ).limit(20)
    
    result = await db.execute(stmt)
    items = result.scalars().all()
    return [{"codigo": i.codigo, "descricao": i.descricao} for i in items]

@router.get("/cest/search")
async def search_cest(
    q: Optional[str] = "",
    ncm: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Busca CEST por código, descrição ou relacionamento de NCM."""
    filters = []
    if q and len(q) >= 2:
        filters.append(or_(
            FiscalCest.codigo.ilike(f"%{q}%"),
            FiscalCest.descricao.ilike(f"%{q}%")
        ))
    
    if ncm and len(ncm) >= 4:
        # Pega a raiz/capitulo do NCM (4 dígitos) para match seguro na tabela CEST
        ncm_prefix = ncm[:4]
        filters.append(FiscalCest.ncm.ilike(f"%{ncm_prefix}%"))

    if not filters:
        return []

    stmt = select(FiscalCest).where(and_(*filters)).limit(50)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return [{"codigo": i.codigo, "descricao": i.descricao} for i in items]

@router.get("/cfop/search")
async def search_cfop(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db)
):
    """Busca CFOP por código ou descrição para autocomplete."""
    stmt = select(FiscalCfop).where(
        or_(
            FiscalCfop.codigo.ilike(f"%{q}%"),
            FiscalCfop.descricao.ilike(f"%{q}%")
        )
    ).limit(50)
    
    result = await db.execute(stmt)
    items = result.scalars().all()
    return [{"codigo": i.codigo, "descricao": i.descricao} for i in items]
