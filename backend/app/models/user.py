"""
VimaERP 2.0 - Model: User (Usuário do sistema).

Mapeia a tabela `users` do PostgreSQL.
Cada usuário pertence a um Tenant e pode acessar uma ou mais Filiais.

⚠️  IDs são UUID (char(26) ULID do Laravel), mapeados como String.
⚠️  Campo é `nome` (não `name`), conforme schema real.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord


class User(BaseActiveRecord):
    __tablename__ = "users"

    # PK — ULID string (26 chars)
    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("tenants.id"), index=True
    )

    nome: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(default=False)

    # Laravel legacy
    remember_token: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )

    # Timestamps
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )

    # Configurações do Usuário (Zustand Sync)
    dashboard_layout: Mapped[Optional[list | dict]] = mapped_column(
        JSONB, nullable=True
    )

    # Relacionamentos
    tenant = relationship("Tenant", back_populates="users")
    filiais = relationship(
        "Filial",
        secondary="filial_user",
        back_populates="users",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
