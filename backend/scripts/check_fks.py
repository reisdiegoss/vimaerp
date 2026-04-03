import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionFactory

async def check_fks():
    async with AsyncSessionFactory() as s:
        # Busca todas as FKs do schema public
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
        res = await s.execute(text(q))
        for row in res.fetchall():
            print(f"DROP CONSTRAINT {row[4]} ON {row[0]} (REFERENCES {row[2]}.{row[3]})")

if __name__ == "__main__":
    asyncio.run(check_fks())
