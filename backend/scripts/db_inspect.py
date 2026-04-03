import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:6ffdd4a3d0e99d78b1e15f411b04e323@master.vimasistemas.com.br:5432/vimaerp"

async def check():
    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'categoria_atributos'"))
            columns = [r[0] for r in res.fetchall()]
            print("Colunas em categoria_atributos:", columns)
    finally:
        await engine.dispose()

asyncio.run(check())
