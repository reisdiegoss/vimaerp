"""
VimaERP 2.0 - Service: Venda.
Lógica de fechamento de venda com transação atômica.
Cria: Venda + VendaItens + MovimentacaoEstoque
"""

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.middleware import get_tenant_id, get_filial_id
from app.models.venda import Venda
from app.models.venda_item import VendaItem
from app.models.movimentacao_estoque import MovimentacaoEstoque
from app.schemas.venda import FecharVendaRequest

from ulid import ULID


class VendaService:
    """Service para operações complexas de venda."""

    @staticmethod
    async def fechar_venda(
        db: AsyncSession,
        usuario_id: str,
        data: FecharVendaRequest,
    ) -> Venda:
        """
        Fecha uma venda no PDV.
        Operação atômica: tudo dentro de uma transação.

        1. Cria a Venda
        2. Cria os VendaItens
        3. Registra saída no estoque (MovimentacaoEstoque)
        """
        if not data.itens:
            raise HTTPException(status_code=400, detail="Venda sem itens")

        tenant_id = get_tenant_id()
        filial_id = get_filial_id()

        if not tenant_id or not filial_id:
            raise HTTPException(status_code=400, detail="Tenant/Filial não definido")

        # Calcular total
        total = 0
        venda_id = str(ULID())

        # 1. Criar a venda
        venda = Venda(
            id=venda_id,
            tenant_id=tenant_id,
            filial_id=filial_id,
            caixa_sessao_id=data.caixa_sessao_id,
            pessoa_id=data.pessoa_id,
            origem="pdv",
            tipo_pagamento=data.tipo_pagamento,
            status="concluida",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        # 2. Criar itens e movimentações
        itens_objs = []
        for item_data in data.itens:
            subtotal = item_data.quantidade * item_data.preco_unitario
            total += subtotal

            item = VendaItem(
                id=str(ULID()),
                venda_id=venda_id,
                produto_id=item_data.produto_id,
                quantidade=item_data.quantidade,
                preco_unitario=item_data.preco_unitario,
                subtotal=subtotal,
                tenant_id=tenant_id,
                filial_id=filial_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            itens_objs.append(item)
            db.add(item)

            # 3. Registrar saída no estoque
            mov = MovimentacaoEstoque(
                id=str(ULID()),
                tenant_id=int(tenant_id) if tenant_id.isdigit() else 0,
                filial_id=int(filial_id) if filial_id.isdigit() else 0,
                produto_id=item_data.produto_id,
                usuario_id=int(usuario_id) if usuario_id.isdigit() else 0,
                tipo="saida",
                quantidade=item_data.quantidade,
                observacao=f"Venda {venda_id}",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(mov)

        venda.total = total
        db.add(venda)
        await db.commit()
        await db.refresh(venda)

        return venda
