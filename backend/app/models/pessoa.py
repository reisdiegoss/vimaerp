"""
VimaERP 2.0 - Model: Pessoa (Cliente/Fornecedor).
Tabela: pessoas | PK: bigint (auto-increment)
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.active_record import BaseActiveRecord


class Pessoa(BaseActiveRecord):
    __tablename__ = "pessoas"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    codigo: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    tipo: Mapped[str] = mapped_column(String(255))  # cliente, fornecedor
    nome: Mapped[str] = mapped_column(String(255))
    cpf_cnpj: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telefone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<Pessoa(id={self.id}, nome='{self.nome}', tipo='{self.tipo}')>"
