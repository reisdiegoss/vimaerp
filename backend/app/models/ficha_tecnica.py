"""
VimaERP 2.0 - Model: FichaTecnica
Tabela: ficha_tecnica | PK: bigint (auto-increment)
Representa a composição (Receita / Matérias-Primas) de um Produto Acabado.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord


class FichaTecnica(BaseActiveRecord):
    __tablename__ = "ficha_tecnica"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    # O Produto de destino (Prato Feito, Ração Mista, Tinta)
    produto_pai_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("produtos.id", ondelete="CASCADE"), index=True
    )
    
    # O Ingrediente/Materia prima (Arroz, Óleo, Essência)
    materia_prima_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("produtos.id", ondelete="RESTRICT"), index=True
    )

    # Medida Float (Ex: 0.5 Kg de Milho)
    quantidade_consumida: Mapped[float] = mapped_column(Float, default=1.0)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    produto_pai = relationship("Produto", foreign_keys=[produto_pai_id], back_populates="ficha_tecnica")
    
    # Relação com a matéria-prima em si para joins automáticos
    materia_prima = relationship("Produto", foreign_keys=[materia_prima_id])

    def __repr__(self) -> str:
        return f"<FichaTecnica(pai={self.produto_pai_id}, ingrediente={self.materia_prima_id}, qtd={self.quantidade_consumida})>"
