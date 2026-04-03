"""Lista os usuários existentes no banco para testar o login."""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def run():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        result = await conn.execute(text(
            "SELECT id, tenant_id, nome, email, substring(password from 1 for 10) as pw_prefix FROM users LIMIT 10"
        ))
        rows = result.fetchall()
        if not rows:
            print("❌ Nenhum usuário encontrado no banco!")
            print("   Será necessário criar um usuário de teste.")
        else:
            print(f"📋 {len(rows)} usuário(s) encontrado(s):\n")
            for row in rows:
                print(f"  ID:        {row[0]}")
                print(f"  Tenant:    {row[1]}")
                print(f"  Nome:      {row[2]}")
                print(f"  Email:     {row[3]}")
                print(f"  Senha:     {row[4]}...")
                print()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
