import asyncio
from app.core.database import engine
from sqlalchemy import text

TABLES_TO_FIX = [
    "categorias",
    "fichas_tecnicas",
    "estoque_lotes",
    "movimentacoes_estoque",
    "notas_fiscais",
    "ordens_servico",
    "ordem_servico_itens",
    "pessoas",
    "produtos",
    "produto_variacoes",
    "vendas",
    "venda_itens",
    "roles",
    "permissions"
]

async def migrate():
    async with engine.connect() as conn:
        for tab in TABLES_TO_FIX:
            print(f"Migrando {tab}...")
            # filial_id
            try:
                # Cada comando DDL no Postgres faz autocommit fora de transação se configurado,
                # Mas para SQLAlchemy 2.0 async, usamos begin no contexto de instrução ou connection.commit().
                await conn.execute(text(f"ALTER TABLE {tab} ALTER COLUMN filial_id TYPE VARCHAR(26) USING filial_id::VARCHAR(26);"))
                await conn.commit()
                print(f"  [OK] filial_id migrada para VARCHAR(26) em {tab}")
            except Exception as e:
                await conn.rollback()
                print(f"  [SKIP/ERROR] erro ao migrar filial_id {tab}: {str(e)[:100]}")
                
            # tenant_id
            try:
                await conn.execute(text(f"ALTER TABLE {tab} ALTER COLUMN tenant_id TYPE VARCHAR(26) USING tenant_id::VARCHAR(26);"))
                await conn.commit()
                print(f"  [OK] tenant_id migrada para VARCHAR(26) em {tab}")
            except Exception as e:
                await conn.rollback()
                print(f"  [SKIP/ERROR] erro ao migrar tenant_id {tab}: {str(e)[:100]}")
        
        # Validando
        result = await conn.execute(text("SELECT data_type FROM information_schema.columns WHERE table_name = 'categorias' AND column_name = 'filial_id'"))
        row = result.fetchone()
        print(f"--- VALIDACAO CATEGORIAS FILIAL_ID: {row[0] if row else 'N/A'} ---")
                
    print("Migração concluída.")

if __name__ == "__main__":
    asyncio.run(migrate())
