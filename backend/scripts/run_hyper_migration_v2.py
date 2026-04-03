import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import re

# Database URL direto do .env (ajustado para asyncpg)
DATABASE_URL = "postgresql+asyncpg://postgres:6ffdd4a3d0e99d78b1e15f411b04e323@master.vimasistemas.com.br:5432/vimaerp"
SQL_FILE = r"c:\Users\Diego Reis\Documents\DEV\VimaERP\backend\migrations\hyper_produto_v2.sql"

async def run_migration():
    print(f"🚀 Iniciando Migration Hyper-Produto v2 no banco remoto...")
    engine = create_async_engine(DATABASE_URL)
    
    try:
        with open(SQL_FILE, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # Remover comentários SQL para evitar erros no split
        sql_clean = re.sub(r'--.*', '', sql_content)
        
        # Split por ';' mas ignorando dentro de aspas (se houver, aqui não tem mas é boa prática)
        commands = [cmd.strip() for cmd in sql_clean.split(';') if cmd.strip()]
        
        async with engine.begin() as conn:
            for i, command in enumerate(commands):
                print(f"📦 [{i+1}/{len(commands)}] Executando bloco SQL...")
                await conn.execute(text(command))
            
        print("✅ Migration CONCLUÍDA com sucesso no servidor master!")
            
    except Exception as e:
        print(f"❌ ERRO na migration: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
