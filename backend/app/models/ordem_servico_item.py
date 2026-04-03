"""
VimaERP 2.0 - Model: Item de Ordem de Serviço.
Tabela: ordem_servico_itens | PK: char(26) ULID
Preços em INTEGER (centavos).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord


class OrdemServicoItem(BaseActiveRecord):
    __tablename__ = "ordem_servico_itens"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    ordem_servico_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("ordens_servico.id")
    )
    produto_id: Mapped[str] = mapped_column(String(26), ForeignKey("produtos.id"))
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))

    quantidade: Mapped[int] = mapped_column(Integer, default=1)
    preco_unitario: Mapped[int] = mapped_column(Integer)  # centavos
    subtotal: Mapped[int] = mapped_column(Integer)  # centavos

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relacionamentos
    ordem_servico = relationship("OrdemServico", back_populates="itens")

    def __repr__(self) -> str:
        return f"<OrdemServicoItem(id={self.id}, produto={self.produto_id})>"
