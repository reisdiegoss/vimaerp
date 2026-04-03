import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Configurações do .env (hardcoded para o script de migração rápida)
DATABASE_URL = "postgresql+asyncpg://postgres:6ffdd4a3d0e99d78b1e15f411b04e323@master.vimasistemas.com.br:5432/vimaerp"
SQL_FILE = r"c:\Users\Diego Reis\Documents\DEV\VimaERP\backend\scripts\migrate_motor_produtos_v5.sql"

async def run_migration():
    engine = create_async_engine(DATABASE_URL)
    
    try:
        with open(SQL_FILE, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # O script SQL contém múltiplos comandos. SQLAlchemy async exige execução individual ou um bloco.
        # Vamos dividir por ';' simples para este caso.
        commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        async with engine.begin() as conn:
            for command in commands:
                print(f"Executando comando...")
                await conn.execute(text(command))
            print("Migration concluída com sucesso!")
            
    except Exception as e:
        print(f"Erro ao executar migration: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
