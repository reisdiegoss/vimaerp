"""
VimaERP 2.0 - Model: Sessão de Caixa.
Tabela: caixa_sessoes | PK: char(26) ULID
Controla abertura e fechamento de caixa no PDV.
Saldos em INTEGER (centavos).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord


class CaixaSessao(BaseActiveRecord):
    __tablename__ = "caixa_sessoes"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    codigo: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    usuario_id: Mapped[str] = mapped_column(String(26), ForeignKey("users.id"))

    status: Mapped[str] = mapped_column(String(255), default="aberto")  # aberto, fechado
    saldo_inicial: Mapped[int] = mapped_column(Integer, default=0)  # centavos
    saldo_final: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # centavos

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relacionamentos
    vendas = relationship("Venda", back_populates="caixa_sessao", lazy="selectin")

    def __repr__(self) -> str:
        return f"<CaixaSessao(id={self.id}, status='{self.status}')>"
