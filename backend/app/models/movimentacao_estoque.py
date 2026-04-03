"""
VimaERP 2.0 - Model: Movimentação de Estoque.
Tabela: movimentacao_estoque | PK: char(26) ULID
Registra entradas, saídas e ajustes de estoque.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.active_record import BaseActiveRecord


class MovimentacaoEstoque(BaseActiveRecord):
    __tablename__ = "movimentacao_estoque"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    produto_id: Mapped[str] = mapped_column(String(26), ForeignKey("produtos.id"))
    lote_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("estoque_lotes.id"), nullable=True)
    usuario_id: Mapped[str] = mapped_column(String(26), ForeignKey("users.id"))

    tipo: Mapped[str] = mapped_column(String(255))  # entrada, saida, ajuste
    quantidade: Mapped[int] = mapped_column(Integer)
    observacao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<MovimentacaoEstoque(id={self.id}, tipo='{self.tipo}', qty={self.quantidade})>"
