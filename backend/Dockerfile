# ══════════════════════════════════════════════════════════
# VimaERP 2.0 — Backend Dockerfile (Production)
# Multi-stage build: slim + non-root user + health check
# ══════════════════════════════════════════════════════════

# ── Stage 1: Builder ──────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Instalar dependências de build (headers para psycopg2/bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Runtime ──────────────────────────────────────
FROM python:3.12-slim AS runtime

# Labels
LABEL maintainer="Vima Sistemas <contato@vimasistemas.com.br>"
LABEL description="VimaERP 2.0 Backend API"
LABEL version="2.0.0"

# Deps de runtime (libpq para asyncpg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar pacotes Python do builder
COPY --from=builder /install /usr/local

# Criar usuário não-root
RUN groupadd -r vimaerp && useradd -r -g vimaerp -d /app -s /sbin/nologin vimaerp

# Diretório da aplicação
WORKDIR /app

# Copiar código
COPY . .

# Remover arquivos desnecessários em produção
RUN rm -rf __pycache__ scripts .env *.md tests .git .gitignore

# Corrigir permissões
RUN chown -R vimaerp:vimaerp /app

# Trocar para usuário não-root
USER vimaerp

# Expor porta
EXPOSE 8000

# Health check interno do Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Gunicorn + Uvicorn workers (produção)
CMD ["python", "-m", "gunicorn", "main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "4", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--graceful-timeout", "30", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--forwarded-allow-ips", "*"]
