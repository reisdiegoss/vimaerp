import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def migrate_roles():
    print("Iniciando migração manual: adicionando tenant_id na tabela roles...")
    
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        try:
            # Tentar adicionar a coluna
            await conn.execute(text("ALTER TABLE roles ADD COLUMN tenant_id VARCHAR(26);"))
            print("Coluna tenant_id adicionada com sucesso.")
        except Exception as e:
            if "already exists" in str(e) or "Duplicate column" in str(e):
                print("Coluna tenant_id já existe na tabela roles.")
            else:
                print(f"Erro ao adicionar coluna (pode não existir roles): {e}")

    await engine.dispose()
    print("Migração finalizada.")

if __name__ == "__main__":
    asyncio.run(migrate_roles())
