import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionFactory

async def create_table():
    async with AsyncSessionFactory() as session:
        print("🛠️  Criando Tabela de Sequenciadores...")
        
        sql = """
        CREATE TABLE IF NOT EXISTS sequenciadores (
            tenant_id VARCHAR(26) NOT NULL,
            filial_id VARCHAR(26) NOT NULL,
            entidade VARCHAR(50) NOT NULL,
            ultimo_numero INTEGER DEFAULT 0,
            PRIMARY KEY (tenant_id, filial_id, entidade)
        );
        """
        
        try:
            await session.execute(text(sql))
            await session.commit()
            print("   ✅ Tabela sequenciadores ok.")
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(create_table())
