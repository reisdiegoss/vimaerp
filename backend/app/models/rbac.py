"""
VimaERP 2.0 - Models RBAC (Spatie Laravel Permission mapeado para Python).
Tabelas: roles, permissions, role_has_permissions, model_has_roles, model_has_permissions
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, DateTime, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord
from app.models.base import Base


# ──────────────────────────────────────────────
# Tabelas associativas (many-to-many)
# ──────────────────────────────────────────────
role_has_permissions = Table(
    "role_has_permissions",
    Base.metadata,
    Column("permission_id", String(26), ForeignKey("permissions.id"), primary_key=True),
    Column("role_id", String(26), ForeignKey("roles.id"), primary_key=True),
)

model_has_roles = Table(
    "model_has_roles",
    Base.metadata,
    Column("role_id", String(26), ForeignKey("roles.id"), primary_key=True),
    Column("model_type", String(255), primary_key=True),
    Column("model_id", String(26), primary_key=True),
)

model_has_permissions = Table(
    "model_has_permissions",
    Base.metadata,
    Column("permission_id", String(26), ForeignKey("permissions.id"), primary_key=True),
    Column("model_type", String(255), primary_key=True),
    Column("model_id", String(26), primary_key=True),
)


# ──────────────────────────────────────────────
# Tabela associativa: filial_user
# ──────────────────────────────────────────────
filial_user = Table(
    "filial_user",
    Base.metadata,
    Column("filial_id", String(26), ForeignKey("filiais.id"), primary_key=True),
    Column("user_id", String(26), ForeignKey("users.id"), primary_key=True),
)


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────
class Role(BaseActiveRecord):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26))  # ISOLAMENTO DE SAAS
    name: Mapped[str] = mapped_column(String(255))
    guard_name: Mapped[str] = mapped_column(String(255))

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relacionamentos
    permissions = relationship(
        "Permission",
        secondary=role_has_permissions,
        back_populates="roles",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"


class Permission(BaseActiveRecord):
    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    guard_name: Mapped[str] = mapped_column(String(255))

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relacionamentos
    roles = relationship(
        "Role",
        secondary=role_has_permissions,
        back_populates="permissions",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Permission(id={self.id}, name='{self.name}')>"


class PasswordResetToken(BaseActiveRecord):
    """Tabela password_reset_tokens — PK composta email."""
    __tablename__ = "password_reset_tokens"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    token: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
