"""
VimaERP 2.0 - Model: Definicao de Atributo (Grade).
Tabela: atributo_definicoes | PK: String(26) (ULID)
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord
from app.models.associations import categoria_atributos


class AtributoDefinicao(BaseActiveRecord):
    __tablename__ = "atributo_definicoes"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    
    nome: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100), index=True)
    
    # Valores sugeridos (Array de Strings) - Ex: ["P", "M", "G"]
    valores_padrao: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    # Atributos vinculados a Categorias (ManyToMany via categoria_atributos)
    categorias = relationship(
        "Categoria",
        secondary="categoria_atributos",
        back_populates="atributos_permitidos"
    )

    def __repr__(self) -> str:
        return f"<AtributoDefinicao(id={self.id}, nome='{self.nome}')>"
