import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionFactory

async def fix_schema():
    async with AsyncSessionFactory() as session:
        print("🛠️ Iniciando Correção de Schema (Forced VARCHAR PKs)...")
        
        tables = [
            'categorias', 'produtos', 'pessoas', 'vendas', 
            'ordens_servico', 'cobrancas', 'caixa_sessoes', 'notas_fiscais'
        ]
        
        for table in tables:
            print(f"   -> Processando {table}...")
            try:
                # 1. Remover PK constraint (precisamos saber o nome, geralmente table_pkey)
                await session.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {table}_pkey CASCADE;"))
                
                # 2. Alterar ID para VARCHAR(26)
                await session.execute(text(f"ALTER TABLE {table} ALTER COLUMN id TYPE VARCHAR(26) USING id::text;"))
                
                # 3. Recriar PK
                await session.execute(text(f"ALTER TABLE {table} ADD PRIMARY KEY (id);"))
                
                # 4. Garantir que CODIGO existe e e VARCHAR
                await session.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS codigo VARCHAR(32);"))
                
                print(f"   ✅ {table} Corrigida.")
            except Exception as e:
                print(f"   ❌ Erro em {table}: {e}")
        
        await session.commit()
        print("🚀 Schema Estabilizado com Sucesso!")

if __name__ == "__main__":
    asyncio.run(fix_schema())
