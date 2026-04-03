"""VimaERP 2.0 - Schemas: Produto, Ficha Técnica e Variacoes."""
from datetime import datetime
from typing import Optional, List, Any, Dict
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


# ==========================================
# Variacao da Grade
# ==========================================
class VariacaoBase(BaseModel):
    sku: Optional[str] = None
    nome_variacao: Optional[str] = None
    atributos: Optional[Dict[str, Any]] = None
    preco_custo: Decimal = Decimal("0.00")
    preco_venda: Decimal = Decimal("0.00")
    estoque_atual: Decimal = Decimal("0.00")
    ativo: bool = True

class VariacaoCreate(VariacaoBase):
    pass

class VariacaoUpdate(VariacaoBase): # Para merge via backend
    id: Optional[str] = None

class VariacaoResponse(VariacaoBase):
    id: str
    produto_pai_id: str
    model_config = {"from_attributes": True}


# ==========================================
# Ficha Tecnica (Receita)
# ==========================================
class FichaTecnicaBase(BaseModel):
    materia_prima_id: str
    quantidade_consumida: float

    @field_validator("materia_prima_id", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        return None if v == "" else v

class FichaTecnicaCreate(FichaTecnicaBase):
    pass

class FichaTecnicaUpdate(FichaTecnicaBase):
    id: Optional[str] = None

class FichaTecnicaResponse(FichaTecnicaBase):
    id: str
    produto_pai_id: str
    model_config = {"from_attributes": True}


# ==========================================
# Produto Core
# ==========================================
class ProdutoBase(BaseModel):
    nome: str
    categoria_id: str
    codigo: Optional[str] = None
    nome_tecnico: Optional[str] = None
    codigo_barras: Optional[str] = None
    
    # Preços
    preco_custo: Decimal = Decimal("0.00")
    preco_venda: Decimal = Decimal("0.00")
    preco_minimo: Decimal = Decimal("0.00")
    margem_lucro: Decimal = Decimal("0.00")
    
    # Unidades e Conversão
    unidade_comercial_id: Optional[str] = None
    unidade_tributaria_id: Optional[str] = None
    fator_conversao: Decimal = Decimal("1.00")
    
    # Medidas e Pesos
    peso_bruto: Decimal = Decimal("0.0000")
    peso_liquido: Decimal = Decimal("0.0000")
    altura: Decimal = Decimal("0.00")
    largura: Decimal = Decimal("0.00")
    comprimento: Decimal = Decimal("0.00")
    
    # Tipo e Comportamento
    tipo_produto: str = "REVENDA"
    controla_lote: bool = False
    controla_grade: bool = False
    ativo: bool = True
    
    # Estoque e Logística
    estoque_minimo: Decimal = Decimal("0.0000")
    estoque_maximo: Decimal = Decimal("0.0000")
    localizacao_fisica: Optional[str] = None
    cross_docking_dias: int = 0
    
    # Fiscais
    ncm: Optional[str] = None
    cest: Optional[str] = None
    origem_mercadoria: Optional[str] = None
    cfop_padrao: Optional[str] = None

    # Marketing e E-commerce
    descricao_detalhada: Optional[str] = None
    link_video_youtube: Optional[str] = None
    link_externo: Optional[str] = None

    # Fornecedor e Suprimentos
    fornecedor_padrao_id: Optional[str] = None
    codigo_referencia_fornecedor: Optional[str] = None
    garantia_meses: int = 0

    @field_validator(
        "categoria_id", 
        "unidade_comercial_id", 
        "unidade_tributaria_id", 
        "fornecedor_padrao_id",
        "codigo",
        "ncm",
        "cest",
        "cfop_padrao",
        "codigo_barras",
        "nome_tecnico",
        "codigo_referencia_fornecedor",
        "localizacao_fisica",
        "descricao_detalhada",
        "link_video_youtube",
        "link_externo",
        mode="before"
    )
    @classmethod
    def empty_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v

class ProdutoCreate(ProdutoBase):
    variacoes: List[VariacaoCreate] = Field(default_factory=list)
    ficha_tecnica: List[FichaTecnicaCreate] = Field(default_factory=list)

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    categoria_id: Optional[str] = None
    codigo: Optional[str] = None
    nome_tecnico: Optional[str] = None
    codigo_barras: Optional[str] = None
    
    # Preços e Margens
    preco_custo: Optional[Decimal] = None
    preco_venda: Optional[Decimal] = None
    preco_minimo: Optional[Decimal] = None
    margem_lucro: Optional[Decimal] = None
    
    # Unidades e Conversão
    unidade_comercial_id: Optional[str] = None
    unidade_tributaria_id: Optional[str] = None
    fator_conversao: Optional[Decimal] = None
    fator_conversao_tributavel: Optional[Decimal] = None
    
    # Medidas e Pesos
    peso_bruto: Optional[Decimal] = None
    peso_liquido: Optional[Decimal] = None
    altura: Optional[Decimal] = None
    largura: Optional[Decimal] = None
    comprimento: Optional[Decimal] = None
    
    # Comportamento
    tipo_produto: Optional[str] = None
    controla_lote: Optional[bool] = None
    controla_grade: Optional[bool] = None
    ativo: Optional[bool] = None
    
    # Estoque e Logística
    estoque_minimo: Optional[Decimal] = None
    estoque_maximo: Optional[Decimal] = None
    localizacao_fisica: Optional[str] = None
    cross_docking_dias: Optional[int] = None
    
    # Fiscais
    ncm: Optional[str] = None
    cest: Optional[str] = None
    origem_mercadoria: Optional[str] = None
    cfop_padrao: Optional[str] = None

    # Marketing
    descricao_detalhada: Optional[str] = None
    link_video_youtube: Optional[str] = None
    link_externo: Optional[str] = None

    # Fornecedor
    fornecedor_padrao_id: Optional[str] = None
    codigo_referencia_fornecedor: Optional[str] = None
    garantia_meses: Optional[int] = None

    variacoes: Optional[List[VariacaoUpdate]] = None
    ficha_tecnica: Optional[List[FichaTecnicaUpdate]] = None


class ProdutoResponse(ProdutoBase):
    id: str
    tenant_id: str
    filial_id: str
    ativo: bool
    unidade_sigla: str = "UN" # Campo virtual para facilitar a UI
    created_at: Optional[datetime] = None
    
    variacoes: List[VariacaoResponse] = Field(default_factory=list)
    ficha_tecnica: List[FichaTecnicaResponse] = Field(default_factory=list)
    
    model_config = {"from_attributes": True}
