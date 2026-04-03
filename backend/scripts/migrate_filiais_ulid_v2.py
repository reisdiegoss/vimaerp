import asyncio
from app.core.database import engine
from sqlalchemy import text

TABLES_TO_FIX = [
    "categorias",
    "estoque_lotes",
    "fichas_tecnicas",
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
    async with engine.begin() as conn:
        for tab in TABLES_TO_FIX:
            print(f"Migrando {tab}...")
            try:
                # Add USING clause for explicit casting in postgres
                await conn.execute(text(f"ALTER TABLE {tab} ALTER COLUMN filial_id TYPE VARCHAR(26) USING filial_id::VARCHAR(26);"))
                print(f"  - filial_id migrada para VARCHAR(26)")
            except Exception as e:
                print(f"  - erro ao migrar filial_id: {e}")
                
            try:
                await conn.execute(text(f"ALTER TABLE {tab} ALTER COLUMN tenant_id TYPE VARCHAR(26) USING tenant_id::VARCHAR(26);"))
                print(f"  - tenant_id migrada para VARCHAR(26)")
            except Exception as e:
                print(f"  - erro ao migrar tenant_id: {e}")
                
    print("Migração concluída.")

if __name__ == "__main__":
    asyncio.run(migrate())
