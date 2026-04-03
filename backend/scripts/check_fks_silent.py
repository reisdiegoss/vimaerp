import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/vimaerp"

async def check_fks():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.connect() as conn:
        q = """
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
        """
        res = await conn.execute(text(q))
        with open("fks_list.txt", "w") as f:
            for row in res.fetchall():
                line = f"ALTER TABLE {row[0]} DROP CONSTRAINT {row[4]}; -- RECREATE: ALTER TABLE {row[0]} ADD CONSTRAINT {row[4]} FOREIGN KEY ({row[1]}) REFERENCES {row[2]}({row[3]})"
                f.write(line + "\n")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_fks())
