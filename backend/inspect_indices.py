import asyncio
from sqlalchemy import text
from app.core.database import engine

async def inspect_db():
    async with engine.connect() as conn:
        # Busca todas as restrições UNIQUE e Índices Únicos da tabela produtos
        query = text("""
            SELECT
                i.relname as index_name,
                a.attname as column_name
            FROM
                pg_class t,
                pg_class i,
                pg_index ix,
                pg_attribute a
            WHERE
                t.oid = ix.indrelid
                and i.oid = ix.indexrelid
                and a.attrelid = t.oid
                and a.attnum = ANY(ix.indkey)
                and t.relkind = 'r'
                and t.relname = 'produtos'
                and ix.indisunique = true;
        """)
        
        result = await conn.execute(query)
        rows = result.fetchall()
        
        print("\n=== ÍNDICES ÚNICOS DETECTADOS NA TABELA PRODUTOS ===")
        for row in rows:
            print(f"Index: {row[0]} | Coluna: {row[1]}")
        print("===================================================\n")

if __name__ == "__main__":
    asyncio.run(inspect_db())
