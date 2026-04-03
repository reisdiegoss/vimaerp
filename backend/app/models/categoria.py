"""
VimaERP 2.0 - Model: Categoria de Produto.
Tabela: categorias | PK: bigint (auto-increment)
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord
from app.models.associations import categoria_atributos


class Categoria(BaseActiveRecord):
    __tablename__ = "categorias"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    codigo: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    nome: Mapped[str] = mapped_column(String(255))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relacionamentos
    produtos = relationship("Produto", back_populates="categoria", lazy="selectin")
    
    # Variantes permitidas para esta categoria (Grade)
    atributos_permitidos = relationship(
        "AtributoDefinicao",
        secondary="categoria_atributos",
        back_populates="categorias",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Categoria(id={self.id}, nome='{self.nome}')>"
