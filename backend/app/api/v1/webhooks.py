"""
VimaERP 2.0 - API: Webhooks Externos.
Processamento de notificações em tempo real do Asaas.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import validate_asaas_token
from app.schemas.asaas import AsaasWebhookPayload
from app.models.financeiro import LancamentoFinanceiro, LancamentoStatus

router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])

@router.post("/asaas", status_code=status.HTTP_200_OK)
async def webhook_asaas(
    payload: AsaasWebhookPayload,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(validate_asaas_token)
):
    """
    Recebe notificações do Asaas e atualiza o financeiro do VimaERP.
    Identificação de Tenant: Realizada via webhook_token no Header (Dependencies).
    """
    event = payload.event
    payment = payload.payment
    asaas_payment_id = payment.id

    # O ActiveRecord já está filtrando pelo tenant_id que foi injetado pela dependência
    lancamento = await LancamentoFinanceiro.first(asaas_payment_id=asaas_payment_id)

    if not lancamento:
        # Se não encontrar, apenas logamos e retornamos 200 para o Asaas parar de tentar
        print(f"Webhook Asaas: Lançamento {asaas_payment_id} não encontrado no VimaERP.")
        return {"status": "ignored", "detail": "Lancamento nao encontrado"}

    # --- PROCESSAMENTO POR EVENTO ---

    if event in ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]:
        # IDEMPOTÊNCIA: Se já estiver pago, ignoramos
        if lancamento.status == LancamentoStatus.PAGO:
            return {"status": "idempotent", "detail": "Lancamento ja esta pago"}

        # Baixa financeira
        lancamento.status = LancamentoStatus.PAGO
        # Prioriza datas do paylaod do Asaas
        lancamento.data_pagamento = payment.paymentDate or payment.confirmedDate or datetime.now().date()
        # Converte float para Decimal/Cents se necessário (o model usa CentsToDecimal)
        lancamento.valor_pago = payment.value
        
        await db.commit()
        return {"status": "success", "event": event, "action": "baixa_efetuada"}

    elif event == "PAYMENT_OVERDUE":
        # Marca como vencido se ainda estiver pendente
        if lancamento.status == LancamentoStatus.PENDENTE:
            # Embora o frontend calcule dinamicamente, atualizamos o banco para filtros de backend
            # Nota: O model não tem status 'VENCIDO' físico, o blueprint sugere, mas o model usa 'PENDENTE' + atrasado property.
            # Se o usuário quiser um status físico VENCIDO, precisaríamos alterar o Enum LancamentoStatus.
            # Vou manter como PENDENTE por enquanto, pois o model atual não suporta VENCIDO como Enum físico.
            pass
        return {"status": "success", "event": event, "action": "status_monitorado"}

    elif event == "PAYMENT_DELETED":
        # Regra de Negócio: Soft Delete (CANCELADO)
        lancamento.status = LancamentoStatus.CANCELADO
        await db.commit()
        return {"status": "success", "event": event, "action": "lancamento_cancelado"}

    return {"status": "ignored", "event": event}
