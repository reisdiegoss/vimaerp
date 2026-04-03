"""
VimaERP 2.0 - Model: Estoque Lote.
Tabela: estoque_lotes | PK: char(26) ULID
Controle de lotes com data de validade (FIFO/FEFO).
"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.active_record import BaseActiveRecord


class EstoqueLote(BaseActiveRecord):
    __tablename__ = "estoque_lotes"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    produto_id: Mapped[str] = mapped_column(String(26), ForeignKey("produtos.id"))

    numero_lote: Mapped[str] = mapped_column(String(255))
    quantidade: Mapped[int] = mapped_column(Integer, default=0)
    data_validade: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<EstoqueLote(id={self.id}, lote='{self.numero_lote}', qty={self.quantidade})>"
