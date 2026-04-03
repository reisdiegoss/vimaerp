import asyncio
from sqlalchemy import text
from app.core.database import engine

async def run_migration():
    print("Iniciando migração de banco...")
    async with engine.begin() as conn:
        try:
            print("Adicionando coluna 'is_admin' à tabela 'users'...")
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;"))
            
            # (Opcional) forçar que o meu usuário seja admin para testes:
            print("Promovendo diegoreisds@gmail.com para admin...")
            await conn.execute(text("UPDATE users SET is_admin = TRUE WHERE email LIKE '%diegoreisds%';"))
            
            print("✅ Sucesso!")
        except Exception as e:
            msg = str(e)
            if "already exists" in msg or "já existe" in msg:
                print("A coluna is_admin já existe.")
            else:
                print("Erro na migração:", msg)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
