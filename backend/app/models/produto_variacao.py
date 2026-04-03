"""
VimaERP 2.0 - Model: ProdutoVariacao
Tabela: produto_variacoes | PK: bigint (auto-increment)
Representa uma célula da Matriz Cartesiana (Grade) de um Produto Pai.
"""

from datetime import datetime
from typing import Optional, Any

from sqlalchemy import BigInteger, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from decimal import Decimal

from app.core.active_record import BaseActiveRecord
from app.core.db_types import CentsToDecimal


class ProdutoVariacao(BaseActiveRecord):
    __tablename__ = "produto_variacoes"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    produto_pai_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("produtos.id", ondelete="CASCADE"), index=True
    )

    # Identificadores
    sku: Mapped[str] = mapped_column(String(255), nullable=True)
    nome_variacao: Mapped[str] = mapped_column(String(255), nullable=True) # Nome formatado como "Azul - M"
    
    # Estrutura JSON para eixos N-dimensionais Ex: {"Cor": "Azul", "Tamanho": "M"}
    atributos: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Monetário e Estoque individualizado
    preco_custo: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))
    preco_venda: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))
    estoque_atual: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))

    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    produto_pai = relationship("Produto", back_populates="variacoes")

    def __repr__(self) -> str:
        return f"<ProdutoVariacao(id={self.id}, sku='{self.sku}', atributos={self.atributos})>"
