"""
VimaERP 2.0 - Model: Cobrança.
Tabela: cobrancas | PK: char(26) ULID
Valor em INTEGER (centavos). Integração com Asaas.
"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import String, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.active_record import BaseActiveRecord


class Cobranca(BaseActiveRecord):
    __tablename__ = "cobrancas"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    codigo: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    venda_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("vendas.id"), nullable=True)
    ordem_servico_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("ordens_servico.id"), nullable=True)

    asaas_charge_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    valor: Mapped[int] = mapped_column(Integer)  # centavos
    vencimento: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(255), default="pendente")
    link_pagamento: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cliques: Mapped[int] = mapped_column(Integer, default=0)

    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<Cobranca(id={self.id}, valor={self.valor}, status='{self.status}')>"
