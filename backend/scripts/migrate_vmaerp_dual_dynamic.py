import asyncio
import ulid
from sqlalchemy import text
from app.core.database import AsyncSessionFactory

TABELAS_CODIGO = {
    "categorias": "CT",
    "produtos": "P",
    "pessoas": "C",
    "vendas": "V",
    "ordens_servico": "OS",
    "cobrancas": "COB",
    "caixa_sessoes": "CX",
    "notas_fiscais": "NF"
}

TABELAS_APOIO = ["venda_itens", "ordem_servico_itens", "produto_variacoes", "ficha_tecnica", "movimentacao_estoque", "estoque_lotes"]
ALL_TABLES = set(TABELAS_CODIGO.keys()) | set(TABELAS_APOIO)

async def run_migration_dynamic():
    async with AsyncSessionFactory() as s:
        print("🛠️ Iniciando Migração Dual DINÂMICA...")
        
        # 1. Mapear e Dropar TODAS as FKs que apontam para ou saem de nossas tabelas
        print("  - Mapeando constraints de Foreign Key...")
        q_fks = """
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
        """
        res = await s.execute(text(q_fks))
        fks = res.fetchall()
        
        print(f"  - Removendo {len(fks)} chaves estrangeiras...")
        for table, col, ref_table, ref_col, name in fks:
            await s.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {name}"))
        
        # 2. Alterar Tipos
        print("  - Convertendo colunas para VARCHAR(26)...")
        # PKs de todas as tabelas conhecidas
        for tab in ALL_TABLES | {"tenants", "filiais", "users"}:
            try:
                await s.execute(text(f"ALTER TABLE {tab} ALTER COLUMN id TYPE VARCHAR(26)"))
            except Exception as e:
                print(f"    ! Pulando PK de {tab}: {e}")

        # FKs mapeadas
        for table, col, ref_table, ref_col, name in fks:
            print(f"    -> Alterando {table}.{col} para VARCHAR(26)")
            await s.execute(text(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE VARCHAR(26)"))

        # 3. Processar Dados
        maps = {}
        for tab in ALL_TABLES:
            print(f"  - Migrando dados de {tab}...")
            if tab in TABELAS_CODIGO:
                await s.execute(text(f"ALTER TABLE {tab} ADD COLUMN IF NOT EXISTS codigo VARCHAR(32)"))

            res = await s.execute(text(f"SELECT id FROM {tab}"))
            rows = res.fetchall()
            
            maps[tab] = {}
            prefixo = TABELAS_CODIGO.get(tab)

            for old_row in rows:
                old_id = old_row[0]
                if isinstance(old_id, str) and len(old_id) == 26:
                    continue
                
                new_id = str(ulid.ULID())
                maps[tab][old_id] = new_id
                
                if prefixo:
                    codigo = f"{prefixo}{str(old_id).zfill(6)}"
                    await s.execute(
                        text(f"UPDATE {tab} SET id = :new, codigo = :cod WHERE id = :old"),
                        {"new": new_id, "cod": codigo, "old": old_id}
                    )
                else:
                    await s.execute(
                        text(f"UPDATE {tab} SET id = :new WHERE id = :old"),
                        {"new": new_id, "old": old_id}
                    )

        # 4. Atualizar Valores das FKs
        print("  - Sincronizando referências (FK values)...")
        for table, col, ref_table, ref_col, name in fks:
            if ref_table in maps:
                print(f"    -> {table}.{col} (Ref: {ref_table})")
                for old_val, new_val in maps[ref_table].items():
                    await s.execute(
                        text(f"UPDATE {table} SET {col} = :new WHERE {col} = :old"),
                        {"new": new_val, "old": str(old_val)}
                    )

        # 5. Recriar Constraints
        print("  - Restaurando chaves estrangeiras...")
        for table, col, ref_table, ref_col, name in fks:
            try:
                await s.execute(text(f"ALTER TABLE {table} ADD CONSTRAINT {name} FOREIGN KEY ({col}) REFERENCES {ref_table}({ref_col})"))
            except Exception as e:
                print(f"    ! Erro ao recriar FK {name}: {e}")

        await s.commit()
        print("✅ MIGRRAÇÃO DINÂMICA CONCLUÍDA!")

if __name__ == "__main__":
    asyncio.run(run_migration_dynamic())
