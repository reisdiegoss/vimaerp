"""
VimaERP 2.0 - Model: Filial (Unidade/Loja).

Mapeia a tabela `filiais` do PostgreSQL.
Cada Filial pertence a um Tenant. É onde as operações ocorrem (PDV, estoque).

⚠️  IDs são UUID (char(26) ULID do Laravel), mapeados como String.
⚠️  Contém campos de integração (Evolution API, Asaas).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord


class Filial(BaseActiveRecord):
    __tablename__ = "filiais"

    # PK — ULID string (26 chars)
    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("tenants.id"), index=True
    )

    nome: Mapped[str] = mapped_column(String(255))
    cnpj: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ie: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Endereço
    logradouro: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    numero: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bairro: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cidade: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    uf: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)
    cep: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Branding
    logo_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email_contato: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Integrações
    evolution_instance: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    evolution_apikey: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    asaas_api_key: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    asaas_wallet_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    # Configurações de Sequenciamento (Smart Codes)
    prefixo_categoria: Mapped[str] = mapped_column(String(5), default="CT")
    prefixo_produto: Mapped[str] = mapped_column(String(5), default="P")
    prefixo_pessoa: Mapped[str] = mapped_column(String(5), default="C") # C para Cliente/Pessoa
    prefixo_venda: Mapped[str] = mapped_column(String(5), default="V")
    prefixo_os: Mapped[str] = mapped_column(String(5), default="OS")

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )

    # Relacionamentos
    tenant = relationship("Tenant", back_populates="filiais")
    users = relationship(
        "User",
        secondary="filial_user",
        back_populates="filiais",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Filial(id={self.id}, nome='{self.nome}')>"
