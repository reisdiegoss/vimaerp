"""
VimaERP 2.0 - Conexão assíncrona com PostgreSQL via SQLAlchemy 2.0.

Responsabilidades:
- Cria o engine async (asyncpg)
- Cria a session factory
- Expõe a dependency `get_db` para injeção nos controllers
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# ──────────────────────────────────────────────
# Engine Assíncrono
# ──────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

# ──────────────────────────────────────────────
# Session Factory
# ──────────────────────────────────────────────
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """
    Dependency do FastAPI que injeta uma session async.
    Uso: `db: AsyncSession = Depends(get_db)`
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
            # Auto-commit ao final da requisição bem sucedida
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
