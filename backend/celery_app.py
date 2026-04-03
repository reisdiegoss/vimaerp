"""
VimaERP 2.0 - Configuração do Celery Worker.

Broker: Redis
Backend: Redis

Para rodar o worker:
    celery -A celery_app worker --loglevel=info --pool=solo

Para rodar em Windows (dev):
    celery -A celery_app worker --loglevel=info --pool=solo
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "vimaerp",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.fiscal",
        "app.tasks.asaas",
        "app.tasks.whatsapp",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)
