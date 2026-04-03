"""
VimaERP 2.0 - Celery Task: Asaas.
Geração de cobranças e processamento de webhooks em background.
"""

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name="asaas.gerar_cobranca_task",
)
def gerar_cobranca_task(self, cobranca_id: str, filial_id: str):
    """
    Task para gerar cobrança no Asaas em background.

    Etapas:
    1. Buscar a Cobrança e os dados do cliente
    2. Buscar a api_key do Asaas da filial
    3. Chamar API do Asaas (POST /payments)
    4. Salvar asaas_charge_id e link_pagamento

    TODO: Implementar integração real com httpx.
    """
    try:
        logger.info(f"[Asaas] Gerando cobrança {cobranca_id} para filial {filial_id}")

        # TODO: Real implementation
        # from app.models.filial import Filial
        # filial = Filial.find_sync(filial_id)
        # httpx.post("https://api.asaas.com/v3/payments", headers=..., json=...)

        logger.info(f"[Asaas] Cobrança {cobranca_id} — processamento iniciado (stub)")

    except Exception as exc:
        logger.error(f"[Asaas] Erro ao gerar cobrança {cobranca_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(name="asaas.processar_webhook_task")
def processar_webhook_task(payment_data: dict):
    """
    Processa webhook do Asaas em background.
    Atualiza status de cobrança e dispara notificações.
    """
    event = payment_data.get("event", "")
    payment = payment_data.get("payment", {})

    logger.info(f"[Asaas] Webhook recebido: {event}")

    # TODO: Atualizar cobrança no banco
    # TODO: Enviar notificação por WhatsApp
