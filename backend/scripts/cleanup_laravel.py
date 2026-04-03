"""
VimaERP 2.0 - Script de limpeza das tabelas do Laravel.

Remove as tabelas de infraestrutura do framework Laravel que não são mais necessárias.
As tabelas de domínio (tenants, users, filiais, produtos, etc) são MANTIDAS.

Uso:
    py backend/scripts/cleanup_laravel.py

⚠️  ATENÇÃO: Este script faz DROP TABLE! Irreversível!
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings

# Tabelas do Laravel para remover
LARAVEL_TABLES = [
    "cache",
    "cache_locks",
    "jobs",
    "failed_jobs",
    "job_batches",
    "sessions",
    "personal_access_tokens",
    "migrations",
]


async def cleanup():
    """Remove as tabelas de infraestrutura do Laravel."""
    engine = create_async_engine(settings.DATABASE_URL)

    async with engine.begin() as conn:
        # Listar tabelas existentes antes
        result = await conn.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        ))
        existing = {row[0] for row in result.fetchall()}

        print(f"📋 Tabelas existentes no banco ({len(existing)}):")
        for t in sorted(existing):
            marker = "🗑️  REMOVER" if t in LARAVEL_TABLES else "   ✅ manter"
            print(f"   {marker} → {t}")

        print("\n" + "=" * 50)

        # Confirmar antes de executar
        confirm = input("\n⚠️  Confirma DROP das tabelas do Laravel? (sim/não): ")
        if confirm.strip().lower() != "sim":
            print("❌ Operação cancelada.")
            return

        # Executar DROP
        for table in LARAVEL_TABLES:
            if table in existing:
                await conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                print(f"   🗑️  DROP TABLE {table} ✅")
            else:
                print(f"   ⏭️  {table} — não existe, pulando.")

        print("\n✅ Limpeza concluída com sucesso!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(cleanup())
