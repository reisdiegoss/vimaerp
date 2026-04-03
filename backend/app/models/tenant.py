"""
VimaERP 2.0 - Model: Tenant (Empresa/Organização).

Mapeia a tabela `tenants` do PostgreSQL.
Tenant é a unidade raiz de isolamento do sistema multi-tenant.

⚠️  IDs são UUID (char(26) ULID do Laravel), mapeados como String.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord


class Tenant(BaseActiveRecord):
    __tablename__ = "tenants"

    # PK — ULID string (26 chars), gerado pelo Laravel, mantido
    id: Mapped[str] = mapped_column(String(26), primary_key=True)

    nome: Mapped[str] = mapped_column(String(255))
    documento: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Soft delete (convenção Laravel)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )

    # Relacionamentos
    filiais = relationship("Filial", back_populates="tenant", lazy="selectin")
    users = relationship("User", back_populates="tenant", lazy="selectin")
    integracoes = relationship("TenantIntegracao", back_populates="tenant", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, nome='{self.nome}')>"
