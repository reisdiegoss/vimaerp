import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionFactory

async def inspect():
    async with AsyncSessionFactory() as session:
        print("--- Inspecionando Schema de 'categorias' ---")
        q = """
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'categorias'
        ORDER BY ordinal_position;
        """
        res = await session.execute(text(q))
        columns = res.fetchall()
        for col in columns:
            print(f"Column: {col[0]} | Type: {col[1]} | Length: {col[2]} | Nullable: {col[3]}")
        
        print("\n--- Verificando Constraints ---")
        q_const = """
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = 'categorias'::regclass;
        """
        res_const = await session.execute(text(q_const))
        constraints = res_const.fetchall()
        for con in constraints:
            print(f"Constraint: {con[0]} | Type: {con[1]}")

if __name__ == "__main__":
    asyncio.run(inspect())
