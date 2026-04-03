"""
VimaERP 2.0 - Script de Migração Massiva: Identidade Dual (ULID + Smart Codes).
Este script converte as PKs de BIGINT para VARCHAR(26) e gera os códigos de negócio preservando os IDs antigos.
"""

import asyncio
import ulid
from sqlalchemy import text
from app.core.database import AsyncSessionFactory

# Configuração das tabelas e prefixos
TABELAS_COM_CODIGO = {
    "categorias": "CT",
    "produtos": "P",
    "pessoas": "C", # Padrao C (Pessoa), pode ser refinado para F depois
    "vendas": "V",
    "ordens_servico": "OS",
    "cobrancas": "COB",
    "caixa_sessoes": "CX",
    "notas_fiscais": "NF"
}

# Tabelas que apenas mudam ID para ULID (sem codigo de negocio visivel)
TABELAS_APOIO = [
    "venda_itens",
    "ordem_servico_itens",
    "produto_variacoes",
    "ficha_tecnica",
    "movimentacao_estoque",
    "estoque_lotes"
]

async def migrate():
    async with AsyncSessionFactory() as session:
        print("🚀 Iniciando migração para Identidade Dual...")
        
        # 1. Criar tabela de Sequenciadores se não existir (Deveria vir da model, mas garantimos aqui)
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS sequenciadores (
                tenant_id VARCHAR(26),
                filial_id VARCHAR(26),
                entidade VARCHAR(50),
                ultimo_numero INTEGER DEFAULT 0,
                PRIMARY KEY (tenant_id, filial_id, entidade)
            )
        """))

        # 2. Adicionar colunas 'codigo' onde faltar
        for tabela in TABELAS_COM_CODIGO.keys():
            print(f"  - Verificando coluna 'codigo' em {tabela}...")
            await session.execute(text(f"ALTER TABLE {tabela} ADD COLUMN IF NOT EXISTS codigo VARCHAR(32)"))

        # 3. Mapeamento Global para atualização de FKs
        # Estrutura: maps[tabela][id_antigo] = id_novo
        maps = {}

        # 4. Processar tabelas principais e gerar novos IDs (ULIDs)
        todas_tabelas = list(TABELAS_COM_CODIGO.keys()) + TABELAS_APOIO
        
        # Desabilitar triggers/constraints para migração limpa
        await session.execute(text("SET session_replication_role = 'replica';"))

        try:
            for tabela in todas_tabelas:
                print(f"📦 Processando tabela: {tabela}")
                
                # Buscar registros atuais
                res = await session.execute(text(f"SELECT id FROM {tabela}"))
                rows = res.fetchall()
                
                if not rows:
                    # Se a tabela está vazia, apenas mudamos o tipo da coluna id se necessário
                    await session.execute(text(f"ALTER TABLE {tabela} ALTER COLUMN id TYPE VARCHAR(26)"))
                    continue

                maps[tabela] = {}
                
                # Mudar tipo da coluna ID para VARCHAR temporariamente para aceitar ULID
                await session.execute(text(f"ALTER TABLE {tabela} ALTER COLUMN id TYPE VARCHAR(26)"))
                
                prefixo = TABELAS_COM_CODIGO.get(tabela)

                for row in rows:
                    id_antigo = row[0]
                    # Se já for string (ULID), ignorar
                    if isinstance(id_antigo, str) and len(id_antigo) == 26:
                        continue
                        
                    id_novo = str(ulid.ULID())
                    maps[tabela][id_antigo] = id_novo
                    
                    # Atualizar PK e Gerar Código
                    if prefixo:
                        # Preservar ID antigo no código (ex: CT000005)
                        codigo_negocio = f"{prefixo}{str(id_antigo).zfill(6)}"
                        await session.execute(
                            text(f"UPDATE {tabela} SET id = :novo, codigo = :cod WHERE id = :velho"),
                            {"novo": id_novo, "cod": codigo_negocio, "velho": str(id_antigo)}
                        )
                        
                        # Atualizar o Sequenciador para esta filial
                        # Pegamos a filial do registro
                        res_f = await session.execute(text(f"SELECT tenant_id, filial_id FROM {tabela} WHERE id = :id"), {"id": id_novo})
                        row_f = res_f.fetchone()
                        if row_f:
                            tid, fid = row_f
                            entidade_nome = tabela.replace('s', '') if tabela.endswith('s') else tabela
                            if entidade_nome == 'ordem_servico': entidade_nome = 'ordemservico'
                            
                            await session.execute(text("""
                                INSERT INTO sequenciadores (tenant_id, filial_id, entidade, ultimo_numero)
                                VALUES (:tid, :fid, :ent, :num)
                                ON CONFLICT (tenant_id, filial_id, entidade) 
                                DO UPDATE SET ultimo_numero = GREATEST(sequenciadores.ultimo_numero, EXCLUDED.ultimo_numero)
                            """), {"tid": tid, "fid": fid, "ent": entidade_nome, "num": int(id_antigo)})
                    else:
                        # Tabelas de apoio (só muda ID)
                        await session.execute(
                            text(f"UPDATE {tabela} SET id = :novo WHERE id = :velho"),
                            {"novo": id_novo, "velho": str(id_antigo)}
                        )

            # 5. Atualizar Foreign Keys (O passo mais sensível)
            print("🔗 Atualizando Foreign Keys...")
            
            # Mapeamento de relacionamentos comuns
            relacionamentos = [
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

            for tab_origem, col_fk, tab_destino in relacionamentos:
                print(f"  - Atualizando {tab_origem}.{col_fk} -> {tab_destino}.id")
                
                # Mudar tipo da coluna FK para VARCHAR(26)
                await session.execute(text(f"ALTER TABLE {tab_origem} ALTER COLUMN {col_fk} TYPE VARCHAR(26)"))
                
                if tab_destino in maps:
                    for id_velho, id_novo in maps[tab_destino].items():
                        await session.execute(
                            text(f"UPDATE {tab_origem} SET {col_fk} = :novo WHERE {col_fk} = :velho"),
                            {"novo": id_novo, "velho": str(id_velho)}
                        )

            await session.commit()
            print("✅ Migração concluída com sucesso!")

        except Exception as e:
            await session.rollback()
            print(f"❌ Erro fatal durante a migração: {e}")
            raise e
        finally:
            # Reativar triggers/constraints
            await session.execute(text("SET session_replication_role = 'origin';"))

if __name__ == "__main__":
    asyncio.run(migrate())
