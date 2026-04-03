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

RELACIONAMENTOS = [
    ("produtos", "categoria_id", "categorias"),
    ("venda_itens", "venda_id", "vendas"),
    ("venda_itens", "produto_id", "produtos"),
    ("produto_variacoes", "produto_pai_id", "produtos"),
    ("ficha_tecnica", "produto_pai_id", "produtos"),
    ("ficha_tecnica", "materia_prima_id", "produtos"),
    ("movimentacao_estoque", "produto_id", "produtos"),
    ("movimentacao_estoque", "usuario_id", "users"),
    ("estoque_lotes", "produto_id", "produtos"),
    ("vendas", "pessoa_id", "pessoas"),
    ("vendas", "ordem_servico_id", "ordens_servico"),
    ("ordens_servico", "pessoa_id", "pessoas"),
    ("ordem_servico_itens", "ordem_servico_id", "ordens_servico"),
    ("ordem_servico_itens", "produto_id", "produtos"),
    ("cobrancas", "venda_id", "vendas"),
    ("cobrancas", "ordem_servico_id", "ordens_servico"),
    ("caixa_sessoes", "usuario_id", "users"),
    ("notas_fiscais", "venda_id", "vendas")
]

ALL_TABLES = set(TABELAS_CODIGO.keys()) | {t[0] for t in RELACIONAMENTOS} | {t[2] for t in RELACIONAMENTOS}

async def run_migration():
    async with AsyncSessionFactory() as s:
        print("🛠️ Iniciando Migração Dual Final...")
        
        # 1. Drop Constraints
        print("  - Removendo chaves estrangeiras temporariamente...")
        for tab_origem, col_fk, tab_destino in RELACIONAMENTOS:
            constraint_name = f"{tab_origem}_{col_fk}_fkey"
            await s.execute(text(f"ALTER TABLE {tab_origem} DROP CONSTRAINT IF EXISTS {constraint_name}"))
        
        # 2. Alterar Tipos de Coluna para VARCHAR(26)
        print("  - Convertendo colunas para VARCHAR(26)...")
        # PKs
        for tab in ALL_TABLES:
            await s.execute(text(f"ALTER TABLE {tab} ALTER COLUMN id TYPE VARCHAR(26)"))
        # FKs
        for tab_origem, col_fk, tab_destino in RELACIONAMENTOS:
            await s.execute(text(f"ALTER TABLE {tab_origem} ALTER COLUMN {col_fk} TYPE VARCHAR(26)"))

        # 3. Processar Dados
        maps = {}
        for tab in ALL_TABLES:
            print(f"  - Processando dados de {tab}...")
            # Adicionar coluna codigo se não existir
            if tab in TABELAS_CODIGO:
                await s.execute(text(f"ALTER TABLE {tab} ADD COLUMN IF NOT EXISTS codigo VARCHAR(32)"))

            res = await s.execute(text(f"SELECT id, tenant_id, filial_id FROM {tab}"))
            rows = res.fetchall()
            
            maps[tab] = {}
            prefixo = TABELAS_CODIGO.get(tab)

            for old_id, tid, fid in rows:
                if isinstance(old_id, str) and len(old_id) == 26:
                    continue # Já é ULID
                
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

        # 4. Atualizar FKs baseadas no mapa
        print("  - Atualizando referências de Foreign Key no banco...")
        for tab_origem, col_fk, tab_destino in RELACIONAMENTOS:
            if tab_destino in maps:
                for old_id, new_id in maps[tab_destino].items():
                    await s.execute(
                        text(f"UPDATE {tab_origem} SET {col_fk} = :new WHERE {col_fk} = :old"),
                        {"new": new_id, "old": old_id}
                    )

        # 5. Re-adicionar Constraints
        print("  - Recriando chaves estrangeiras...")
        for tab_origem, col_fk, tab_destino in RELACIONAMENTOS:
            constraint_name = f"{tab_origem}_{col_fk}_fkey"
            await s.execute(text(f"ALTER TABLE {tab_origem} ADD CONSTRAINT {constraint_name} FOREIGN KEY ({col_fk}) REFERENCES {tab_destino}(id)"))

        await s.commit()
        print("✅ Migração Finalizada com Sucesso!")

if __name__ == "__main__":
    asyncio.run(run_migration())
