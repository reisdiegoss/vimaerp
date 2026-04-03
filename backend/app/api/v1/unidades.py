"""
VimaERP 2.0 - Endpoints: Unidades de Medida.
Listagem global e por tenant de unidades (UN, KG, CX).
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.core.middleware import get_tenant_id
from app.models.unidade_medida import UnidadeMedida
from pydantic import BaseModel

router = APIRouter(prefix="/unidades", tags=["Cadastros/Unidades"])

class UnidadeRead(BaseModel):
    id: str
    sigla: str
    nome: str
    padrao_sefaz: bool

    class Config:
        from_attributes = True

@router.get("", response_model=List[UnidadeRead])
async def list_unidades(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Lista unidades de medida disponíveis.
    Retorna as padrões do sistema + as customizadas do tenant.
    """
    stmt = select(UnidadeMedida).where(
        or_(UnidadeMedida.tenant_id == "SISTEMA", UnidadeMedida.tenant_id == tenant_id)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
