"""
VimaERP 2.0 - Segurança: JWT e hashing de senhas.

Suporta hashes do Laravel ($2y$) convertendo para $2b$ (bcrypt padrão Python).
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ──────────────────────────────────────────────
# Contexto de Hashing (bcrypt)
# ──────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Gera hash bcrypt de uma senha em texto puro."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica senha contra hash bcrypt.
    Compatível com hashes do Laravel ($2y$) — converte para $2b$ antes de verificar.
    """
    # Laravel usa prefixo $2y$ mas o algoritmo é o mesmo bcrypt.
    # Python (passlib) espera $2b$.
    if hashed_password.startswith("$2y$"):
        hashed_password = "$2b$" + hashed_password[4:]
    return pwd_context.verify(plain_password, hashed_password)


# ──────────────────────────────────────────────
# JWT Token
# ──────────────────────────────────────────────
def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """Cria um JWT assinado com os dados fornecidos."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:
    """Decodifica e valida um JWT. Retorna None se inválido/expirado."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None
