import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

async def setup():
    query = """
    CREATE TABLE IF NOT EXISTS fiscal_cfop (
        codigo VARCHAR(4) PRIMARY KEY,
        descricao TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text(query))
        print("Table fiscal_cfop successfully created!")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(setup())
