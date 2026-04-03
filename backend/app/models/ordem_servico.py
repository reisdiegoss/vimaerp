"""
VimaERP 2.0 - Model: Ordem de Serviço.
Tabela: ordens_servico | PK: char(26) ULID
Total em INTEGER (centavos).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord


class OrdemServico(BaseActiveRecord):
    __tablename__ = "ordens_servico"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    codigo: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    pessoa_id: Mapped[str] = mapped_column(String(26), ForeignKey("pessoas.id"))

    equipamento: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    defeito_relatado: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    laudo_tecnico: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(255), default="orcamento")
    total: Mapped[int] = mapped_column(Integer, default=0)  # centavos

    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relacionamentos
    itens = relationship("OrdemServicoItem", back_populates="ordem_servico", lazy="selectin")

    def __repr__(self) -> str:
        return f"<OrdemServico(id={self.id}, status='{self.status}')>"
