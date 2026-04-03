"""
VimaERP 2.0 - Model: Venda.
Tabela: vendas | PK: char(26) ULID
Total em INTEGER (centavos).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

from app.core.active_record import BaseActiveRecord
from app.core.db_types import CentsToDecimal


class Venda(BaseActiveRecord):
    __tablename__ = "vendas"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    codigo: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    caixa_sessao_id: Mapped[str] = mapped_column(String(26), ForeignKey("caixa_sessoes.id"))
    pessoa_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("pessoas.id"), nullable=True)
    ordem_servico_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("ordens_servico.id"), nullable=True)

    origem: Mapped[str] = mapped_column(String(255), default="pdv")  # pdv, web
    total: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))  # centavos
    status: Mapped[str] = mapped_column(String(255), default="concluida")
    tipo_pagamento: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relacionamentos
    caixa_sessao = relationship("CaixaSessao", back_populates="vendas")
    itens = relationship("VendaItem", back_populates="venda", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Venda(id={self.id}, total={self.total}, status='{self.status}')>"
