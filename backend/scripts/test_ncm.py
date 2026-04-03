import asyncio
from sqlalchemy import text
from app.core.database import engine

async def run():
    async with engine.begin() as conn:
        try:
            query = text("""
                INSERT INTO fiscal_ncm (codigo, descricao, created_at)
                VALUES ('12345678', 'TESTE NCM', now())
                ON CONFLICT (codigo) DO UPDATE 
                SET descricao = EXCLUDED.descricao, updated_at = now()
                RETURNING (xmax = 0) AS inserido
            """)
            result = await conn.execute(query)
            try:
                row = result.fetchone()
                print(f"ROWS: {row}")
            except Exception as fe:
                print(f"FETCH ERROR: {type(fe).__name__} - {fe}")
        except Exception as e:
            print(f"EXEC ERROR: {type(e).__name__} - {e}")

asyncio.run(run())
