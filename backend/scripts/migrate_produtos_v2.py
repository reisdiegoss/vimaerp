"""
VimaERP 2.0 - Migration Script para Banco de Dados.
Evolui a tabela de `produtos` adicionando as colunas necessárias para 
suporte a Ficha Técnica e Matriz de Variações (Grades).
"""
import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.models.base import Base
# Importar a central de models criará tabelas que não existem
import app.models  # noqa: F401


async def run_migration():
    print("Iniciando migração do Módulo de Produtos V2...")
    try:
        async with engine.begin() as conn:
            print("Alterando tabela 'produtos' (Injetando novas colunas)...")
            # Adiciona colunas se não existirem
            # Em PostgreSQL 11+ ADD COLUMN IF NOT EXISTS é suportado nativamente
            
            alter_sqls = [
                "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50) DEFAULT 'REVENDA';",
                "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS controla_lote BOOLEAN DEFAULT false;",
                "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS controla_grade BOOLEAN DEFAULT false;",
                "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ncm VARCHAR(20);",
                "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cest VARCHAR(20);",
                "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS origem_mercadoria VARCHAR(2);",
            ]
            
            for sql in alter_sqls:
                await conn.execute(text(sql))
            
            print("Colunas de 'produtos' garantidas com sucesso!")
        
        # Cria as novas tabelas SQLAlchemy (produto_variacoes, ficha_tecnica)
        print("Sincronizando Metadata SQLAlchemy (Criando tabelas filhas se não existirem)...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        print("Migração concluída com sucesso! Banco preparado para Grades Mistas e Fichas Técnicas.")

    except Exception as e:
        print(f"Erro durante a migração: {e}")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_migration())
