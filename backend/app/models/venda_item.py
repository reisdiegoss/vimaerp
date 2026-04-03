"""
VimaERP 2.0 - Model: Item de Venda.
Tabela: venda_itens | PK: char(26) ULID
Preços em INTEGER (centavos).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

from app.core.active_record import BaseActiveRecord
from app.core.db_types import CentsToDecimal


class VendaItem(BaseActiveRecord):
    __tablename__ = "venda_itens"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    venda_id: Mapped[str] = mapped_column(String(26), ForeignKey("vendas.id"))
    produto_id: Mapped[str] = mapped_column(String(26), ForeignKey("produtos.id"))
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))

    quantidade: Mapped[int] = mapped_column(Integer, default=1)
    preco_unitario: Mapped[Decimal] = mapped_column(CentsToDecimal)  # centavos db -> app Decimal
    subtotal: Mapped[Decimal] = mapped_column(CentsToDecimal)  # centavos db -> app Decimal

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relacionamentos
    venda = relationship("Venda", back_populates="itens")

    def __repr__(self) -> str:
        return f"<VendaItem(id={self.id}, produto={self.produto_id}, qty={self.quantidade})>"
