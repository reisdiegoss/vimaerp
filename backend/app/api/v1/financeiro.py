"""
VimaERP 2.0 - Controller: Financeiro.
Controle de Categorias, Contas Bancárias e Lançamentos (Ledger).
"""

from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, and_

from app.core.dependencies import get_db, get_current_user
from app.core.middleware import get_tenant_id, get_filial_id
from app.models.financeiro import (
    ContaBancaria, 
    CategoriaFinanceira, 
    LancamentoFinanceiro,
    TipoMovimentacao,
    LancamentoStatus
)
from app.schemas.financeiro import (
    ContaBancariaCreate,
    ContaBancariaResponse,
    CategoriaFinanceiraCreate,
    CategoriaFinanceiraResponse,
    LancamentoFinanceiroCreate,
    LancamentoFinanceiroResponse
)

router = APIRouter(prefix="/api/v1/financeiro", tags=["Financeiro"])

# 1. CATEGORIAS FINANCEIRAS
@router.get("/categorias", response_model=List[CategoriaFinanceiraResponse])
async def listar_categorias(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await CategoriaFinanceira.all(db=db)

@router.post("/categorias", response_model=CategoriaFinanceiraResponse, status_code=201)
async def criar_categoria(data: CategoriaFinanceiraCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    categoria = CategoriaFinanceira(**data.model_dump())
    categoria.tenant_id = get_tenant_id()
    await categoria.save(db=db)
    return categoria

@router.delete("/categorias/{categoria_id}", status_code=204)
async def excluir_categoria(categoria_id: str, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    categoria = await CategoriaFinanceira.find(categoria_id, db=db)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    try:
        await categoria.delete(db=db)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Não é possível excluir uma categoria que possui lançamentos atrelados.")

# 2. CONTAS BANCÁRIAS
@router.get("/contas", response_model=List[ContaBancariaResponse])
async def listar_contas(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await ContaBancaria.all(db=db)

@router.post("/contas", response_model=ContaBancariaResponse, status_code=201)
async def criar_conta(data: ContaBancariaCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    conta = ContaBancaria(**data.model_dump())
    conta.tenant_id = get_tenant_id()
    conta.filial_id = get_filial_id()
    if not conta.filial_id:
         raise HTTPException(status_code=400, detail="É necessário selecionar uma filial ativa.")
    await conta.save(db=db)
    return conta

# 3. LANÇAMENTOS FINANCEIROS
@router.get("/lancamentos", response_model=List[LancamentoFinanceiroResponse])
async def listar_lancamentos(
    vencimento_inicio: Optional[date] = None,
    vencimento_fim: Optional[date] = None,
    pagamento_inicio: Optional[date] = None,
    pagamento_fim: Optional[date] = None,
    tipo: Optional[TipoMovimentacao] = None,
    status: Optional[LancamentoStatus] = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    query_filters = []
    if tipo: query_filters.append(LancamentoFinanceiro.tipo == tipo)
    if status: query_filters.append(LancamentoFinanceiro.status == status)
    if vencimento_inicio: query_filters.append(LancamentoFinanceiro.data_vencimento >= vencimento_inicio)
    if vencimento_fim: query_filters.append(LancamentoFinanceiro.data_vencimento <= vencimento_fim)
    if pagamento_inicio: query_filters.append(LancamentoFinanceiro.data_pagamento >= pagamento_inicio)
    if pagamento_fim: query_filters.append(LancamentoFinanceiro.data_pagamento <= pagamento_fim)

    stmt = select(LancamentoFinanceiro)
    if query_filters:
        stmt = stmt.where(and_(*query_filters))
    stmt = LancamentoFinanceiro._inject_tenant_filter(stmt)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/lancamentos", response_model=LancamentoFinanceiroResponse, status_code=201)
async def criar_lancamento(data: LancamentoFinanceiroCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    lancamento = LancamentoFinanceiro(**data.model_dump())
    lancamento.tenant_id = get_tenant_id()
    lancamento.filial_id = get_filial_id()
    if not lancamento.filial_id:
         raise HTTPException(status_code=400, detail="É necessário selecionar uma filial ativa.")
    await lancamento.save(db=db)
    return lancamento

@router.patch("/lancamentos/{lancamento_id}/pagar", response_model=LancamentoFinanceiroResponse)
async def baixar_lancamento(
    lancamento_id: str,
    data_pagamento: date,
    valor_pago: Decimal,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    lancamento = await LancamentoFinanceiro.find(lancamento_id, db=db)
    if not lancamento:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")
    if lancamento.status == LancamentoStatus.PAGO:
        raise HTTPException(status_code=400, detail="Este lançamento já consta como pago.")
    lancamento.status = LancamentoStatus.PAGO
    lancamento.data_pagamento = data_pagamento
    lancamento.valor_pago = valor_pago
    lancamento.updated_at = datetime.utcnow()
    await lancamento.save(db=db)
    return lancamento
