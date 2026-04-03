"""
VimaERP 2.0 - Modelos: Financeiro.
Padrão de Lançamento Unificado (Ledger).
"""

from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

from sqlalchemy import String, Numeric, ForeignKey, DateTime, Date, Enum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.active_record import BaseActiveRecord
from app.core.db_types import CentsToDecimal

class TipoConta(str, enum.Enum):
    CONTA_CORRENTE = "CONTA_CORRENTE"
    CONTA_DIGITAL = "CONTA_DIGITAL"
    CAIXA_FISICO = "CAIXA_FISICO"
    POUPANCA = "POUPANCA"
    INVESTIMENTO = "INVESTIMENTO"

class TipoMovimentacao(str, enum.Enum):
    RECEITA = "RECEITA"
    DESPESA = "DESPESA"

class LancamentoStatus(str, enum.Enum):
    PENDENTE = "PENDENTE"
    PAGO = "PAGO"
    CANCELADO = "CANCELADO"
    EM_PROCESSAMENTO = "EM_PROCESSAMENTO"
    EM_DISPUTA = "EM_DISPUTA"

class ContaBancaria(BaseActiveRecord):
    __tablename__ = "contas_bancarias"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True, nullable=False)
    filial_id: Mapped[str] = mapped_column(String(26), index=True, nullable=False)
    
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo: Mapped[TipoConta] = mapped_column(Enum(TipoConta, name="tipo_conta_enum"), default=TipoConta.CONTA_CORRENTE)
    saldo_inicial: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))
    
    banco: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    agencia: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    conta: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    lancamentos: Mapped[List["LancamentoFinanceiro"]] = relationship("LancamentoFinanceiro", back_populates="conta_bancaria")

    def __repr__(self) -> str:
        return f"<ContaBancaria(id={self.id}, nome='{self.nome}')>"

class CategoriaFinanceira(BaseActiveRecord):
    __tablename__ = "categorias_financeiras"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True, nullable=False)
    
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo: Mapped[TipoMovimentacao] = mapped_column(Enum(TipoMovimentacao, name="tipo_movimentacao_enum"), nullable=False)
    cor_hex: Mapped[Optional[str]] = mapped_column(String(7), nullable=True) # Ex: #FF0000
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    lancamentos: Mapped[List["LancamentoFinanceiro"]] = relationship("LancamentoFinanceiro", back_populates="categoria")

    def __repr__(self) -> str:
        return f"<CategoriaFinanceira(id={self.id}, nome='{self.nome}', tipo='{self.tipo}')>"

class LancamentoFinanceiro(BaseActiveRecord):
    __tablename__ = "lancamentos_financeiros"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True, nullable=False)
    filial_id: Mapped[str] = mapped_column(String(26), index=True, nullable=False)
    
    descricao: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[TipoMovimentacao] = mapped_column(Enum(TipoMovimentacao, name="tipo_movimentacao_enum"), nullable=False)
    
    valor: Mapped[Decimal] = mapped_column(CentsToDecimal, nullable=False)
    valor_pago: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))
    
    status: Mapped[LancamentoStatus] = mapped_column(
        Enum(LancamentoStatus, name="lancamento_status_enum"), 
        default=LancamentoStatus.PENDENTE, 
        nullable=False
    )
    
    data_vencimento: Mapped[date] = mapped_column(Date, nullable=False)
    data_pagamento: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Chaves Estrangeiras
    conta_bancaria_id: Mapped[str] = mapped_column(
        String(26), 
        ForeignKey("contas_bancarias.id", ondelete="RESTRICT"), 
        nullable=False
    )
    categoria_id: Mapped[str] = mapped_column(
        String(26), 
        ForeignKey("categorias_financeiras.id", ondelete="RESTRICT"), 
        nullable=False
    )
    pessoa_id: Mapped[Optional[str]] = mapped_column(
        String(26), 
        ForeignKey("pessoas.id", ondelete="RESTRICT"), 
        nullable=True
    )
    
    # Integração Asaas
    asaas_payment_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    asaas_invoice_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    conta_bancaria: Mapped["ContaBancaria"] = relationship("ContaBancaria", back_populates="lancamentos")
    categoria: Mapped["CategoriaFinanceira"] = relationship("CategoriaFinanceira", back_populates="lancamentos")
    # Pessoa opcional (pode ser gasto interno)
    pessoa = relationship("Pessoa")

    @property
    def atrasado(self) -> bool:
        """Indica se o lançamento está pendente e com data de vencimento no passado."""
        if self.status == LancamentoStatus.PENDENTE and self.data_vencimento < date.today():
            return True
        return False

    # Índices compostos para busca rápida por tenant/vencimento
    __table_args__ = (
        Index("idx_lancamento_vencimento", "tenant_id", "data_vencimento"),
        Index("idx_lancamento_status", "tenant_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Lancamento(id={self.id}, desc='{self.descricao}', valor={self.valor})>"
