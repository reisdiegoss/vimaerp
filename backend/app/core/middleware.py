"""
VimaERP 2.0 - Middleware Multi-Tenant.

Extrai tenant_id do JWT e filial_id do header X-Filial-Id,
injetando em contextvars para uso global assíncrono.
"""

import contextvars
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.security import decode_access_token

# ──────────────────────────────────────────────
# Context Variables (Thread-safe e async-safe)
# ──────────────────────────────────────────────
current_tenant_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_tenant_id", default=None
)
current_filial_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_filial_id", default=None
)
current_user_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_user_id", default=None
)


def get_tenant_id() -> Optional[str]:
    """Retorna o tenant_id do contexto da requisição atual."""
    return current_tenant_id.get()


def get_filial_id() -> Optional[str]:
    """Retorna o filial_id do contexto da requisição atual."""
    return current_filial_id.get()


def get_user_id() -> Optional[str]:
    """Retorna o user_id do contexto da requisição atual."""
    return current_user_id.get()


# ──────────────────────────────────────────────
# Rotas que não precisam de autenticação
# ──────────────────────────────────────────────
PUBLIC_PATHS = {
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/auth/login",
    "/api/v1/cobrancas/webhook/asaas",
    "/api/v1/webhooks/asaas",
    "/health",
}


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware ASGI que intercepta toda requisição:
    1. Extrai o Bearer Token do header Authorization
    2. Decodifica o JWT e obtém tenant_id e user_id
    3. Lê o header X-Filial-Id
    4. Seta tudo em contextvars para uso no Active Record
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Rotas públicas passam direto
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        # Extrair Bearer token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            payload = decode_access_token(token)

            if payload:
                # Setar contextvars com dados do JWT
                tenant_token = current_tenant_id.set(payload.get("tenant_id"))
                user_token = current_user_id.set(payload.get("user_id"))

                # Filial vem do header (o frontend manda qual filial está ativa)
                filial_header = request.headers.get("X-Filial-Id")
                filial_token = current_filial_id.set(
                    filial_header if filial_header else None
                )
                
                # Rastreamento de usuários ativos (fire-and-forget)
                if filial_header and payload.get("tenant_id") and payload.get("user_id"):
                    import asyncio
                    from app.core.redis import track_user_activity
                    asyncio.create_task(
                        track_user_activity(payload["tenant_id"], filial_header, payload["user_id"])
                    )

                try:
                    response = await call_next(request)
                    return response
                finally:
                    # Limpar contextvars após a requisição
                    current_tenant_id.reset(tenant_token)
                    current_user_id.reset(user_token)
                    current_filial_id.reset(filial_token)

        # Sem token válido — deixa passar (a dependency de auth vai barrar)
        return await call_next(request)
