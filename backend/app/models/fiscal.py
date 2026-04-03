"""
VimaERP 2.0 - Model: Tabelas Fiscais (NCM e CEST).
Tabelas Globais para consulta governamental.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.active_record import BaseActiveRecord


class FiscalNcm(BaseActiveRecord):
    __tablename__ = "fiscal_ncm"

    codigo: Mapped[str] = mapped_column(String(8), primary_key=True)
    descricao: Mapped[str] = mapped_column(Text)
    
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<FiscalNcm(codigo={self.codigo})>"


class FiscalCest(BaseActiveRecord):
    __tablename__ = "fiscal_cest"

    codigo: Mapped[str] = mapped_column(String(7), primary_key=True)
    ncm: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    descricao: Mapped[str] = mapped_column(Text)
    
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<FiscalCest(codigo={self.codigo}, ncm={self.ncm})>"

class FiscalCfop(BaseActiveRecord):
    __tablename__ = "fiscal_cfop"

    codigo: Mapped[str] = mapped_column(String(4), primary_key=True)
    descricao: Mapped[str] = mapped_column(Text)
    
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<FiscalCfop(codigo={self.codigo})>"
