from sqlalchemy import Table, Column, String, ForeignKey
from app.models.base import Base

# Tabela associativa: Categorias <-> Atributos (Grade)
categoria_atributos = Table(
    "categoria_atributos",
    Base.metadata,
    Column("categoria_id", String(26), ForeignKey("categorias.id"), primary_key=True),
    Column("atributo_definicao_id", String(26), ForeignKey("atributo_definicoes.id"), primary_key=True),
)
