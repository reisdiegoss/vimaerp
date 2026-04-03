import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionFactory
from app.core.middleware import current_tenant_id, current_filial_id
from app.models.categoria import Categoria
from sqlalchemy import select

async def setup_test_data(session):
    # Garantir que a filial de teste existe para o sequenciador funcionar
    print("🛠️  Preparando dados de teste (Filial/Tenant)...")
    await session.execute(text("INSERT INTO filiais (id, tenant_id, nome, prefixo_categoria) VALUES ('TEST_FILIAL', 'TEST_TENANT', 'Filial Teste', 'CT') ON CONFLICT (id) DO NOTHING;"))
    await session.commit()

async def test_dual_identity():
    async with AsyncSessionFactory() as session:
        await setup_test_data(session)
        
        print("🧪 Testando Insercao com Identidade Dual...")
        
        # 0. Mock Contexto (Obrigatório para Smart Code)
        token_t = current_tenant_id.set("TEST_TENANT")
        token_f = current_filial_id.set("TEST_FILIAL")
        
        try:
            # 1. Criar e Salvar uma nova categoria usando Active Record
            nova_cat = Categoria(
                tenant_id="TEST_TENANT",
                filial_id="TEST_FILIAL",
                nome=f"Teste Identidade Dual {asyncio.get_event_loop().time()}",
                ativo=True
            )
            
            await nova_cat.save(session)
            
            print(f"✅ Categoria Criada!")
            print(f"   - ID (ULID): {nova_cat.id}")
            print(f"   - Codigo: {nova_cat.codigo}")
            
            # 2. Verificar se o codigo segue o sequenciador
            res = await session.execute(select(Categoria).where(Categoria.id == nova_cat.id))
            confirmada = res.scalar_one()
            
            assert confirmada.id is not None
            assert len(confirmada.id) == 26
            assert confirmada.codigo is not None
            assert confirmada.codigo.startswith("CT")
            
            print("🚀 Teste Concluido com Sucesso!")
        finally:
            # Limpar contexto
            current_tenant_id.reset(token_t)
            current_filial_id.reset(token_f)

if __name__ == "__main__":
    asyncio.run(test_dual_identity())
