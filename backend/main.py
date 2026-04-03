"""
VimaERP 2.0 - Ponto de Entrada (FastAPI Application).

Inicializa o app, registra middlewares, rotas e eventos de lifecycle.

Para rodar:
    py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.database import engine
from app.core.middleware import TenantMiddleware

# ──────────────────────────────────────────────
# Importar models (resolve relationships do SQLAlchemy)
# ──────────────────────────────────────────────
import app.models  # noqa: F401  — registra Tenant, User, Filial no mapper

# ──────────────────────────────────────────────
# Importar routers
# ──────────────────────────────────────────────
from app.api.v1.auth import router as auth_router
from app.api.v1.produtos import router as produtos_router
from app.api.v1.categorias import router as categorias_router
from app.api.v1.pessoas import router as pessoas_router
from app.api.v1.vendas import router as vendas_router
from app.api.v1.pdv import router as pdv_router
from app.api.v1.estoque import router as estoque_router
from app.api.v1.cobrancas import router as cobrancas_router
from app.api.v1.fiscal import router as fiscal_router
from app.api.v1.ordens_servico import router as os_router
from app.api.v1.rbac import router as rbac_router
from app.api.v1.users import router as users_router
from app.api.v1.filiais import router as filiais_router
from app.api.v1.atributos import router as atributos_router
from app.api.v1.unidades import router as unidades_router
from app.api.v1.financeiro import router as financeiro_router
from app.api.v1.integracoes import router as integracoes_router
from app.api.v1.webhooks import router as webhooks_router


# ──────────────────────────────────────────────
# Lifecycle (startup / shutdown)
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Valida conexão com banco no startup e fecha no shutdown."""
    # Startup: testar conexão
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT 1"))
        assert result.scalar() == 1
        print("✅ Conexão com PostgreSQL estabelecida com sucesso!")

    yield

    # Shutdown: fechar engine
    await engine.dispose()
    print("🔌 Conexão com banco encerrada.")


# ──────────────────────────────────────────────
# App FastAPI
# ──────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema ERP e PDV — Backend API",
    # Em produção: desabilita Swagger UI aberto (acesso via /redoc se necessário)
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ──────────────────────────────────────────────
# Excessões Globais
# ──────────────────────────────────────────────
@app.exception_handler(IntegrityError)
async def sqlalchemy_integrity_error_handler(request: Request, exc: IntegrityError):
    """Garante que violações de banco retornem 400 descritivo."""
    error_msg = str(exc.orig) if exc.orig else str(exc)
    
    import re
    # Busca por padrões de erro do Postgres: "Key (campo)=(valor) already exists."
    match = re.search(r"Key \((.*?)\)=\((.*?)\) already exists", error_msg)
    
    if match:
        field = match.group(1).replace("_id", "").replace("_key", "").upper()
        value = match.group(2)
        detail = f"O valor '{value}' para o campo '{field}' já está em uso em outro registro."
    elif "UniqueViolationError" in error_msg or "duplicate key" in error_msg:
        detail = "Registro duplicado ou violado uma restrição única."
    elif "ForeignKeyViolationError" in error_msg or "violates foreign key constraint" in error_msg:
        detail = "Erro de integridade: Um registro relacionado (Categoria, Unidade, etc) não foi encontrado ou está sendo usado."
    else:
        detail = "Erro de integridade relacional. Verifique os dados enviados."

    return JSONResponse(
        status_code=400,
        content={
            "detail": detail, 
            "database_error": error_msg,
            "field": match.group(1) if match else None
        }
    )

# ──────────────────────────────────────────────
# Middlewares
# ──────────────────────────────────────────────
# CORS — em produção restringe aos domínios reais, permitindo ambiente local
ALLOWED_ORIGINS = (
    ["*"]
    if settings.DEBUG
    else [
        "https://app.vimaerp.com.br",
        "https://vimaerp.com.br",
        "https://www.vimaerp.com.br",
        "http://localhost:5173",  # Permitir dev server do Frontend
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Filial-Id", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

# Tenant Middleware — extrai JWT e seta contextvars
app.add_middleware(TenantMiddleware)


# ──────────────────────────────────────────────
# Rotas
# ──────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """Health check básico."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check com verificação do banco."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


# Registrar routers da API v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(produtos_router)
app.include_router(categorias_router)
app.include_router(pessoas_router)
app.include_router(vendas_router)
app.include_router(pdv_router)
app.include_router(estoque_router)
app.include_router(cobrancas_router)
app.include_router(fiscal_router)
app.include_router(os_router)
app.include_router(rbac_router)
app.include_router(users_router, prefix="/api/v1")
app.include_router(filiais_router, prefix="/api/v1")
app.include_router(atributos_router, prefix="/api/v1", tags=["Admin/Grade"])
app.include_router(unidades_router, prefix="/api/v1", tags=["Admin/Unidades"])
app.include_router(financeiro_router)
app.include_router(integracoes_router)
app.include_router(webhooks_router)
