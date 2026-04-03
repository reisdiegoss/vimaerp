"""
VimaERP 2.0 - Model: Produto (Hyper-Master).
Tabela: produtos | PK: String(26) (ULID)
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal
import enum
from app.core.active_record import BaseActiveRecord
from app.core.db_types import CentsToDecimal

class TipoProduto(str, enum.Enum):
    REVENDA = "REVENDA"
    MATERIA_PRIMA = "MATERIA_PRIMA"
    PRODUTO_ACABADO = "PRODUTO_ACABADO"
    SERVICO = "SERVICO"

class Produto(BaseActiveRecord):
    __tablename__ = "produtos"

    # 1. Identificacao e Posicionamento
    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(26), index=True)
    filial_id: Mapped[str] = mapped_column(String(26))
    
    codigo: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    categoria_id: Mapped[str] = mapped_column(String(26), ForeignKey("categorias.id"))
    
    nome: Mapped[str] = mapped_column(String(255))
    nome_tecnico: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    codigo_barras: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # 2. Unidades e Medidas
    unidade_comercial_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("unidades_medida.id"), nullable=True)
    unidade_tributaria_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("unidades_medida.id"), nullable=True)
    fator_conversao: Mapped[Decimal] = mapped_column(Numeric(18, 6), default=Decimal("1.000000"))
    
    peso_bruto: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=Decimal("0.0000"))
    peso_liquido: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=Decimal("0.0000"))
    
    # 3. Precificacao (Valores em Centavos no Banco)
    preco_custo: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))
    preco_venda: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))
    preco_minimo: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))
    preco_custo_medio: Mapped[Decimal] = mapped_column(CentsToDecimal, default=Decimal("0.00"))
    margem_lucro: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"))

    # 4. Comportamentos e Logistica
    tipo_produto: Mapped[str] = mapped_column(String(50), default="REVENDA")
    controla_lote: Mapped[bool] = mapped_column(Boolean, default=False)
    controla_grade: Mapped[bool] = mapped_column(Boolean, default=False)
    
    estoque_minimo: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=Decimal("0.0000"))
    estoque_maximo: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=Decimal("0.0000"))
    localizacao_fisica: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Dimensoes
    altura: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"))
    largura: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"))
    comprimento: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"))
    cross_docking_dias: Mapped[int] = mapped_column(Integer, default=0)

    # 5. Fiscal / Tributario
    ncm: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cest: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    origem_mercadoria: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)
    cfop_padrao: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    grupo_imposto_id: Mapped[Optional[str]] = mapped_column(String(26), nullable=True)

    # 6. E-commerce e Marketing
    descricao_detalhada: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    link_video_youtube: Mapped[Optional[str]] = mapped_column(String(250), nullable=True)
    link_externo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # 7. Relacionamentos Estendidos
    fornecedor_padrao_id: Mapped[Optional[str]] = mapped_column(String(26), ForeignKey("pessoas.id"), nullable=True)
    codigo_referencia_fornecedor: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    garantia_meses: Mapped[int] = mapped_column(Integer, default=0)
    observacoes_internas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    categoria = relationship("Categoria", back_populates="produtos")
    unidade_comercial = relationship("UnidadeMedida", foreign_keys=[unidade_comercial_id])
    unidade_tributaria = relationship("UnidadeMedida", foreign_keys=[unidade_tributaria_id])
    fornecedor_padrao = relationship("Pessoa")
    
    variacoes = relationship("ProdutoVariacao", back_populates="produto_pai", cascade="all, delete-orphan", lazy="selectin")
    ficha_tecnica = relationship(
        "FichaTecnica", 
        foreign_keys="[FichaTecnica.produto_pai_id]", 
        back_populates="produto_pai", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    @property
    def unidade_sigla(self) -> str:
        """Retorna a sigla da unidade comercial vinculada ou 'UN' como fallback."""
        try:
            if self.unidade_comercial:
                return self.unidade_comercial.sigla
        except Exception:
            pass
        return "UN"

    def __repr__(self) -> str:
        return f"<Produto(id={self.id}, nome='{self.nome}', preco={self.preco_venda})>"
