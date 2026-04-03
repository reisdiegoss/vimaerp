"""
VimaERP 2.0 - Schemas: Financeiro.
"""

from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.models.financeiro import TipoConta, TipoMovimentacao, LancamentoStatus

# --- CONTA BANCÁRIA ---

class ContaBancariaBase(BaseModel):
    nome: str
    tipo: TipoConta = TipoConta.CONTA_CORRENTE
    saldo_inicial: Decimal = Decimal("0.00")
    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None

class ContaBancariaCreate(ContaBancariaBase):
    pass

class ContaBancariaUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[TipoConta] = None
    saldo_inicial: Optional[Decimal] = None
    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None

class ContaBancariaResponse(ContaBancariaBase):
    id: str
    tenant_id: str
    filial_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- CATEGORIA FINANCEIRA ---

class CategoriaFinanceiraBase(BaseModel):
    nome: str
    tipo: TipoMovimentacao
    cor_hex: Optional[str] = Field(None, max_length=7)

class CategoriaFinanceiraCreate(CategoriaFinanceiraBase):
    pass

class CategoriaFinanceiraUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[TipoMovimentacao] = None
    cor_hex: Optional[str] = None

class CategoriaFinanceiraResponse(CategoriaFinanceiraBase):
    id: str
    tenant_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- LANÇAMENTO FINANCEIRO ---

class LancamentoFinanceiroBase(BaseModel):
    descricao: str
    tipo: TipoMovimentacao
    valor: Decimal
    valor_pago: Decimal = Decimal("0.00")
    status: LancamentoStatus = LancamentoStatus.PENDENTE
    data_vencimento: date
    data_pagamento: Optional[date] = None
    conta_bancaria_id: str
    categoria_id: str
    pessoa_id: Optional[str] = None
    asaas_payment_id: Optional[str] = None
    asaas_invoice_url: Optional[str] = None

class LancamentoFinanceiroCreate(LancamentoFinanceiroBase):
    # Status padrão PENDENTE já está no Base
    pass

class LancamentoFinanceiroUpdate(BaseModel):
    descricao: Optional[str] = None
    tipo: Optional[TipoMovimentacao] = None
    valor: Optional[Decimal] = None
    valor_pago: Optional[Decimal] = None
    status: Optional[LancamentoStatus] = None
    data_vencimento: Optional[date] = None
    data_pagamento: Optional[date] = None
    conta_bancaria_id: Optional[str] = None
    categoria_id: Optional[str] = None
    pessoa_id: Optional[str] = None

class LancamentoFinanceiroResponse(LancamentoFinanceiroBase):
    id: str
    tenant_id: str
    filial_id: str
    atrasado: bool = False # Campo dinâmico
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
