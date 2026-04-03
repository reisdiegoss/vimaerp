"""
VimaERP 2.0 - Service: Estoque.
Movimentação de estoque com rastreamento de lotes.
"""

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.middleware import get_tenant_id, get_filial_id
from app.models.movimentacao_estoque import MovimentacaoEstoque
from app.schemas.estoque import MovimentarEstoqueRequest

from ulid import ULID


class EstoqueService:
    """Service para operações de estoque."""

    @staticmethod
    async def movimentar(
        db: AsyncSession,
        usuario_id: str,
        data: MovimentarEstoqueRequest,
    ) -> MovimentacaoEstoque:
        """
        Registra uma movimentação de estoque (entrada, saída ou ajuste).
        """
        if data.tipo not in ("entrada", "saida", "ajuste"):
            raise HTTPException(
                status_code=400,
                detail="Tipo inválido. Use: entrada, saida ou ajuste",
            )

        if data.quantidade <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantidade deve ser positiva",
            )

        tenant_id = get_tenant_id()
        filial_id = get_filial_id()

        mov = MovimentacaoEstoque(
            id=str(ULID()),
            tenant_id=int(tenant_id) if tenant_id and tenant_id.isdigit() else 0,
            filial_id=int(filial_id) if filial_id and filial_id.isdigit() else 0,
            produto_id=data.produto_id,
            lote_id=data.lote_id,
            usuario_id=int(usuario_id) if usuario_id.isdigit() else 0,
            tipo=data.tipo,
            quantidade=data.quantidade,
            observacao=data.observacao,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(mov)
        await db.commit()
        await db.refresh(mov)

        return mov
