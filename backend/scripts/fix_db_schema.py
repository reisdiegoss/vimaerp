import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Configuração Baseada no script run_v5_migration.py do usuário
DATABASE_URL = "postgresql+asyncpg://postgres:6ffdd4a3d0e99d78b1e15f411b04e323@master.vimasistemas.com.br:5432/vimaerp"

async def fix_schema():
    engine = create_async_engine(DATABASE_URL)
    
    commands = [
        # 1. Adicionar dashboard_layout na tabela users
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;",
        
        # 2. Criar tabela associativa categoria_atributos (Grade)
        """
        CREATE TABLE IF NOT EXISTS categoria_atributos (
            categoria_id VARCHAR(26) REFERENCES categorias(id) ON DELETE CASCADE,
            atributo_id VARCHAR(26) REFERENCES atributo_definicoes(id) ON DELETE CASCADE,
            PRIMARY KEY (categoria_id, atributo_id)
        );
        """
    ]
    
    try:
        print("🚀 Iniciando Correção de Schema do Banco de Dados...")
        async with engine.begin() as conn:
            for sql in commands:
                print(f"Executando: {sql[:50]}...")
                await conn.execute(text(sql))
        print("✅ Banco de Dados sincronizado com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao sincronizar banco: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_schema())
