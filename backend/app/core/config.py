"""
VimaERP 2.0 - Configurações centrais da aplicação.
Lê variáveis do .env via Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações globais do VimaERP, carregadas do .env"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- App ---
    APP_NAME: str = "VimaERP"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # --- Database (PostgreSQL + asyncpg) ---
    DATABASE_URL: str

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- Security & Criptografia ---
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas
    
    # Chave para criptografia simétrica (Fernet) — 32 bytes base64
    FERNET_KEY: str = "vima_default_fernet_key_change_me_32bytes="

    # --- Asaas Webhook (Depreciado em favor do Multi-Tenant) ---
    ASAAS_WEBHOOK_TOKEN: str = "vima_default_secret_change_me"

    @property
    def database_url_sync(self) -> str:
        """URL síncrona para Alembic e scripts de manutenção."""
        return self.DATABASE_URL.replace(
            "postgresql+asyncpg://", "postgresql+psycopg2://"
        )


settings = Settings()
