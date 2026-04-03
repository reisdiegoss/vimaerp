"""
VimaERP 2.0 - Model: Sequenciador.
Controla o último número utilizado por entidade/filial para gerar o Código de Negócio.
"""

from sqlalchemy import String, Integer, Column, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class Sequenciador(Base):
    __tablename__ = "sequenciadores"

    # Composicao de PK para isolamento por Filial
    tenant_id: Mapped[str] = mapped_column(String(26), primary_key=True)
    filial_id: Mapped[str] = mapped_column(String(26), primary_key=True)
    entidade: Mapped[str] = mapped_column(String(50), primary_key=True) # 'categoria', 'produto', etc.
    
    ultimo_numero: Mapped[int] = mapped_column(Integer, default=0)

    def __repr__(self) -> str:
        return f"<Sequenciador(entidade='{self.entidade}', ultimo={self.ultimo_numero})>"
