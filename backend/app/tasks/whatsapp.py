"""
VimaERP 2.0 - Celery Task: WhatsApp.
Envio de mensagens via Evolution API em background.
"""

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=10,
    name="whatsapp.enviar_mensagem_task",
)
def enviar_mensagem_task(
    self,
    filial_id: str,
    telefone: str,
    mensagem: str,
):
    """
    Task para enviar mensagem via WhatsApp (Evolution API).

    Etapas:
    1. Buscar instância e apikey da Evolution API da filial
    2. Chamar POST /message/sendText da Evolution API
    3. Registrar log de envio

    TODO: Implementar integração real com httpx.
    """
    try:
        logger.info(
            f"[WhatsApp] Enviando para {telefone} via filial {filial_id}"
        )

        # TODO: Real implementation
        # from app.models.filial import Filial
        # filial = Filial.find_sync(filial_id)
        # evolution_url = f"https://evolution.vimaerp.com.br"
        # httpx.post(
        #     f"{evolution_url}/message/sendText/{filial.evolution_instance}",
        #     headers={"apikey": filial.evolution_apikey},
        #     json={"number": telefone, "text": mensagem},
        # )

        logger.info(f"[WhatsApp] Mensagem enviada para {telefone} (stub)")

    except Exception as exc:
        logger.error(f"[WhatsApp] Erro ao enviar para {telefone}: {exc}")
        raise self.retry(exc=exc)


@shared_task(name="whatsapp.enviar_cupom_task")
def enviar_cupom_task(venda_id: str, telefone: str):
    """
    Envia cupom fiscal/não-fiscal por WhatsApp.
    """
    logger.info(f"[WhatsApp] Enviando cupom da venda {venda_id} para {telefone}")
    # TODO: Gerar PDF do cupom e enviar via Evolution API
