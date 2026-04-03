import asyncio
import sys
import os

# Adiciona o diretório raiz ao path para importar o app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

async def seed_fiscal():
    print("🌱 Iniciando semente fiscal básica (NCM/CEST)...")
    
    ncms = [
        ("61091000", "Camisetas de malha, de algodão"),
        ("64039190", "Calçados com sola exterior de borracha"),
        ("42022210", "Bolsas com superfície exterior de folhas de plástico"),
        ("84713012", "Laptops (Unidades de processamento de dados)"),
        ("73239300", "Utensílios de cozinha de aço inoxidável")
    ]
    
    cests = [
        ("2803800", "61091000", "Produtos têxteis confeccionados"),
        ("2000100", "64039190", "Calçados e artefatos de couro")
    ]

    async with engine.begin() as conn:
        # Inserir NCMs
        for cod, desc in ncms:
            await conn.execute(
                text("INSERT INTO fiscal_ncm (codigo, descricao, created_at) VALUES (:c, :d, now()) ON CONFLICT (codigo) DO NOTHING"),
                {"c": cod, "d": desc}
            )
        
        # Inserir CESTs
        for cod, ncm, desc in cests:
            await conn.execute(
                text("INSERT INTO fiscal_cest (codigo, ncm, descricao, created_at) VALUES (:c, :n, :d, now()) ON CONFLICT (codigo) DO NOTHING"),
                {"c": cod, "n": ncm, "d": desc}
            )

    print("✅ Semente fiscal concluída!")

if __name__ == "__main__":
    asyncio.run(seed_fiscal())
