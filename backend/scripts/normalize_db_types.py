import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionFactory

async def normalize_schema():
    async with AsyncSessionFactory() as session:
        print("🚀 Iniciando Normalizacao Global de Tipos (ULID Support)...")
        
        # 1. Buscar todas as tabelas e colunas que podem ser IDs ou FKs
        find_q = """
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND (column_name = 'id' OR column_name LIKE '%%_id')
          AND data_type IN ('integer', 'bigint');
        """
        res = await session.execute(text(find_q))
        to_fix = res.fetchall()
        
        print(f"📦 Encontradas {len(to_fix)} colunas para converter.")
        
        # 2. Desativar FKs temporariamente (CASCADE no DROP é mais seguro)
        for table, col in to_fix:
            print(f"   -> Convertendo {table}.{col} para VARCHAR(26)...")
            try:
                # Se for PK 'id', precisamos dropar a constraint primeiro
                if col == 'id':
                    await session.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {table}_pkey CASCADE;"))
                
                # Converter Tipo
                await session.execute(text(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE VARCHAR(26) USING {col}::text;"))
                
                # Se era PK, recriar
                if col == 'id':
                    await session.execute(text(f"ALTER TABLE {table} ADD PRIMARY KEY (id);"))
                
                print(f"   ✅ {table}.{col} ok.")
            except Exception as e:
                print(f"   ❌ Erro em {table}.{col}: {e}")
        
        # 3. Garantir coluna 'codigo' em tabelas de negocio
        business_tables = [
            'categorias', 'produtos', 'pessoas', 'vendas', 
            'ordens_servico', 'cobrancas', 'caixa_sessoes', 'notas_fiscais'
        ]
        for bt in business_tables:
            await session.execute(text(f"ALTER TABLE {bt} ADD COLUMN IF NOT EXISTS codigo VARCHAR(32);"))

        await session.commit()
        print("🏁 Normalizacao Concluida!")

if __name__ == "__main__":
    asyncio.run(normalize_schema())
