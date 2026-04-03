import asyncio
import sys
import os

from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

async def setup():
    query = """
    ALTER TABLE fiscal_cest ALTER COLUMN ncm TYPE TEXT;
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text(query))
        print("Table fiscal_cest successfully altered: ncm is now TEXT!")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(setup())
