import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:6ffdd4a3d0e99d78b1e15f411b04e323@master.vimasistemas.com.br:5432/vimaerp"

async def list_tables():
    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [r[0] for r in res.fetchall()]
            print("--- TABELAS ENCONTRADAS NO BANCO ---")
            for t in sorted(tables):
                print(f"- {t}")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_tables())
