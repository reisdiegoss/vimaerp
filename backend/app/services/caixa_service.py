"""
VimaERP 2.0 - Service: Caixa/PDV.
Abertura e fechamento de sessões de caixa.
"""

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.middleware import get_tenant_id, get_filial_id
from app.models.caixa_sessao import CaixaSessao

from ulid import ULID


class CaixaService:
    """Service para operações de caixa do PDV."""

    @staticmethod
    async def abrir_sessao(
        db: AsyncSession,
        usuario_id: str,
        saldo_inicial: int = 0,
    ) -> CaixaSessao:
        """
        Abre uma nova sessão de caixa.
        Valida que o usuário não possui outra sessão aberta.
        """
        tenant_id = get_tenant_id()
        filial_id = get_filial_id()

        # Verificar se já existe sessão aberta
        sessao_existente = await CaixaSessao.first(
            db=db,
            usuario_id=usuario_id,
            status="aberto",
        )
        if sessao_existente:
            raise HTTPException(
                status_code=409,
                detail="Já existe uma sessão de caixa aberta para este usuário",
            )

        sessao = CaixaSessao(
            id=str(ULID()),
            tenant_id=tenant_id,
            filial_id=filial_id,
            usuario_id=usuario_id,
            status="aberto",
            saldo_inicial=saldo_inicial,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(sessao)
        await db.commit()
        await db.refresh(sessao)

        return sessao

    @staticmethod
    async def fechar_sessao(
        db: AsyncSession,
        sessao_id: str,
        saldo_final: int,
    ) -> CaixaSessao:
        """
        Fecha uma sessão de caixa.
        Registra o saldo final declarado pelo operador.
        """
        sessao = await CaixaSessao.find(sessao_id, db=db)
        if not sessao:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        if sessao.status == "fechado":
            raise HTTPException(status_code=409, detail="Sessão já está fechada")

        sessao.status = "fechado"
        sessao.saldo_final = saldo_final
        sessao.updated_at = datetime.utcnow()

        db.add(sessao)
        await db.commit()
        await db.refresh(sessao)

        return sessao
