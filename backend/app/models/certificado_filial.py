"""
VimaERP 2.0 - Model: Certificado Digital da Filial.
Tabela: certificados_filial | PK: char(26) ULID
"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import String, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.active_record import BaseActiveRecord


class CertificadoFilial(BaseActiveRecord):
    __tablename__ = "certificados_filial"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26), ForeignKey("filiais.id"))

    path_certificado: Mapped[str] = mapped_column(String(255))
    senha: Mapped[str] = mapped_column(String(255))
    validade: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<CertificadoFilial(id={self.id}, validade={self.validade})>"
