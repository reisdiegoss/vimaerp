"""
VimaERP 2.0 - Client Redis.

Gerencia operações de cache e rastreamento de usuários em tempo real.
"""

import time
import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Criação do pool global do Redis
# decode_responses=True garante que strings venham como str (não bytes)
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.error(f"Erro ao conectar no Redis: {e}")
    redis_client = None

async def track_user_activity(tenant_id: str, filial_id: str, user_id: str):
    """
    Rastreia um usuário como ativo no Redis em dada filial.
    Utiliza um Sorted Set com o score sendo o timestamp atual.
    Expurga inativos (> 5 minutos).
    """
    if not redis_client:
        return
        
    key = f"active_users:{tenant_id}:{filial_id}"
    now = int(time.time())
    
    try:
        # 1. Atualizar ou inserir timestamp do user
        await redis_client.zadd(key, {user_id: now})
        
        # 2. Remover quem não faz requisição a mais de 5 minutos (300 segundos)
        cutoff = now - 300
        await redis_client.zremrangebyscore(key, "-inf", cutoff)
        
        # 3. Dar um TTL ao SortedSet inteiro para evitar vazamento se filial for apagada
        await redis_client.expire(key, 600)  # Key morre em 10 minutos de inatividade
    except Exception as e:
        logger.error(f"Erro ao registrar tracking no Redis para o user {user_id}: {e}")

async def get_active_users_count(tenant_id: str, filial_id: str) -> int:
    """
    Retorna o total de usuários ativos (últimos 5 minutos) na filial solicitada.
    """
    if not redis_client:
        return 0
        
    key = f"active_users:{tenant_id}:{filial_id}"
    now = int(time.time())
    cutoff = now - 300
    
    try:
        # Primeiro limpamos os inativos
        await redis_client.zremrangebyscore(key, "-inf", cutoff)
        # Depois contamos
        return await redis_client.zcard(key)
    except Exception as e:
        logger.error(f"Erro ao buscar contagem de usuários ativos no Redis: {e}")
        return 0
