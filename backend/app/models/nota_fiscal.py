"""
VimaERP 2.0 - Model: Nota Fiscal.
Tabela: notas_fiscais | PK: char(26) ULID
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.active_record import BaseActiveRecord


class NotaFiscal(BaseActiveRecord):
    __tablename__ = "notas_fiscais"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    codigo: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    venda_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("vendas.id"), nullable=True)

    chave_acesso: Mapped[Optional[str]] = mapped_column(String(44), nullable=True)
    protocolo_autorizacao: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    xml_assinado: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(255), default="pendente")
    ambiente: Mapped[str] = mapped_column(String(255), default="homologacao")

    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<NotaFiscal(id={self.id}, status='{self.status}')>"
