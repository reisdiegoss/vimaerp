import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Configuração Master do VimaERP
DATABASE_URL = "postgresql+asyncpg://postgres:6ffdd4a3d0e99d78b1e15f411b04e323@master.vimasistemas.com.br:5432/vimaerp"

async def add_fields():
    engine = create_async_engine(DATABASE_URL)
    
    commands = [
        # 1. Adicionar slug para URLs amigáveis e chaves de grade
        "ALTER TABLE atributo_definicoes ADD COLUMN IF NOT EXISTS slug VARCHAR(100);",
        
        # 2. Adicionar valores_padrao (JSONB) para os eixos da grade
        "ALTER TABLE atributo_definicoes ADD COLUMN IF NOT EXISTS valores_padrao JSONB DEFAULT '[]'::jsonb;",
        
        # 3. Criar índice no slug para performance
        "CREATE INDEX IF NOT EXISTS idx_atributo_definicoes_slug ON atributo_definicoes(slug);"
    ]
    
    try:
        print("🚀 Sincronizando AtributoDefinicao (Grade Master)...")
        async with engine.begin() as conn:
            for sql in commands:
                print(f"Executando SQL: {sql[:60]}...")
                await conn.execute(text(sql))
        print("✅ Colunas 'slug' e 'valores_padrao' adicionadas com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro na migração: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_fields())
