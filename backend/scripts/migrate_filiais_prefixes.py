import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionFactory

async def migrate_prefixes():
    async with AsyncSessionFactory() as session:
        print("🛠️  Migrando Prefixos da Tabela Filiais...")
        
        # SQL para adicionar colunas de prefixo se não existirem
        queries = [
            "ALTER TABLE filiais ADD COLUMN IF NOT EXISTS prefixo_categoria VARCHAR(5);",
            "ALTER TABLE filiais ADD COLUMN IF NOT EXISTS prefixo_produto VARCHAR(5);",
            "ALTER TABLE filiais ADD COLUMN IF NOT EXISTS prefixo_pessoa VARCHAR(5);",
            "ALTER TABLE filiais ADD COLUMN IF NOT EXISTS prefixo_venda VARCHAR(5);",
            "ALTER TABLE filiais ADD COLUMN IF NOT EXISTS prefixo_os VARCHAR(5);"
        ]
        
        for q in queries:
            try:
                print(f"   -> Executando: {q}")
                await session.execute(text(q))
                await session.commit()
                print(f"   ✅ OK.")
            except Exception as e:
                print(f"   ❌ Erro: {e}")
                await session.rollback()

        print("🏁 Migracao Finalizada com Sucesso!")

if __name__ == "__main__":
    asyncio.run(migrate_prefixes())
