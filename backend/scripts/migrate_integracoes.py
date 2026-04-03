import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

# Carregar váriaveis de ambiente
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    if not DATABASE_URL:
        print("❌ DATABASE_URL não encontrada no .env")
        return

    engine = create_async_engine(DATABASE_URL)
    
    commands = [
        """
        CREATE TABLE IF NOT EXISTS tenant_integracoes (
            id VARCHAR(26) PRIMARY KEY,
            tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            provedor VARCHAR(50) NOT NULL DEFAULT 'ASAAS',
            api_key TEXT,
            webhook_token VARCHAR(255) UNIQUE,
            ativo BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_tenant_integracoes_tenant_id ON tenant_integracoes(tenant_id);",
        "CREATE INDEX IF NOT EXISTS idx_tenant_integracoes_provedor ON tenant_integracoes(provedor);",
        "CREATE INDEX IF NOT EXISTS idx_tenant_integracoes_webhook_token ON tenant_integracoes(webhook_token);"
    ]
    
    try:
        print(f"🚀 Conectando ao Banco de Dados...")
        async with engine.begin() as conn:
            for sql in commands:
                print(f"Executando SQL...")
                await conn.execute(text(sql))
        print("✅ Tabela 'tenant_integracoes' criada com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro na migração: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
