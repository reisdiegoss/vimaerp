"""
VimaERP 2.0 - Model: Unidade de Medida.
Tabela: unidades_medida | PK: String(26) (ULID)
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.active_record import BaseActiveRecord

class UnidadeMedida(BaseActiveRecord):
    __tablename__ = "unidades_medida"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    
    sigla: Mapped[str] = mapped_column(String(10))  # Ex: UN, KG, PC
    nome: Mapped[str] = mapped_column(String(100))  # Ex: Unidade, Quilograma
    padrao_sefaz: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<UnidadeMedida(id={self.id}, sigla='{self.sigla}')>"
