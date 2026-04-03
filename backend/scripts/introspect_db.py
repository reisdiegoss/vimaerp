"""Introspecção COMPLETA de todas as tabelas do banco."""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def run():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # Todas as tabelas
        tables_result = await conn.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        ))
        tables = [row[0] for row in tables_result.fetchall()]

        for table in tables:
            cols = await conn.execute(text(f"""
                SELECT column_name, data_type, is_nullable, column_default,
                       character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = '{table}'
                ORDER BY ordinal_position
            """))
            print(f"\n{'='*70}")
            print(f"  {table.upper()} ")
            print(f"{'='*70}")
            for col in cols.fetchall():
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                default = f" DEFAULT {col[3]}" if col[3] else ""
                maxlen = f"({col[4]})" if col[4] else ""
                print(f"  {col[0]:35s} {col[1]}{maxlen:15s} {nullable}{default}")

        # Foreign keys
        print(f"\n\n{'='*70}")
        print("  FOREIGN KEYS")
        print(f"{'='*70}")
        fks = await conn.execute(text("""
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name
        """))
        for fk in fks.fetchall():
            print(f"  {fk[0]}.{fk[1]} → {fk[2]}.{fk[3]}")

        # Row counts
        print(f"\n\n{'='*70}")
        print("  ROW COUNTS")
        print(f"{'='*70}")
        for table in tables:
            count = await conn.execute(text(f'SELECT COUNT(*) FROM "{table}"'))
            c = count.scalar()
            print(f"  {table:35s} {c:>8d} registros")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
