"""
VimaERP 2.0 - Dependencies do FastAPI.

Funções de injeção de dependência para uso nos controllers.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token

security_scheme = HTTPBearer()


async def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """
    Dependency que extrai e valida o JWT do header Authorization.
    Retorna o payload decodificado ou levanta 401.
    """
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


async def get_current_user(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Dependency que retorna o objeto User completo do banco.
    Uso nos controllers: `user: User = Depends(get_current_user)`
    """
    from app.models.user import User

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem user_id.",
        )

    user = await User.find(user_id, session=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
        )
    return user
from fastapi import Header, HTTPException, status
from app.models.integracao import TenantIntegracao
from app.core.middleware import current_tenant_id

async def validate_asaas_token(
    asaas_access_token: str = Header(None, alias="asaas-access-token")
) -> str:
    """
    Valida o token dinâmico do webhook.
    Identifica o Tenant dono do token no banco de dados.
    """
    if not asaas_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token do Webhook ausente."
        )
    
    # Buscar integração com este token
    integracao = await TenantIntegracao.first(webhook_token=asaas_access_token, ativo=True)
    
    if not integracao:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token do Webhook inválido ou expiração da conta."
        )

    # SEGURANÇA: Injetar o tenant_id no contexto explicitamente para este request
    # Isso garante que a query do LancamentoFinanceiro no router use o tenant correto
    current_tenant_id.set(integracao.tenant_id)

    return integracao.tenant_id
