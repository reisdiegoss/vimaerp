"""
VimaERP 2.0 - Model: TenantIntegracao.
Armazena configurações de APIs externas (ex: Asaas) por cliente.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.active_record import BaseActiveRecord

class TenantIntegracao(BaseActiveRecord):
    __tablename__ = "tenant_integracoes"

    # PK ULID (26 chars)
    id: Mapped[str] = mapped_column(String(26), primary_key=True)

    # FK para o Tenant
    tenant_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("tenants.id"), nullable=False, index=True
    )

    # Qual o serviço? ex: 'ASAAS', 'MERCADOPAGO'
    provedor: Mapped[str] = mapped_column(String(50), default="ASAAS", index=True)

    # Chave secreta da API (Sempre salva criptografada pelo cryptography.py)
    api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Token exclusivo para o Webhook (Identificação do Tenant na URL genérica)
    webhook_token: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )

    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=datetime.now)

    # Relacionamento
    tenant = relationship("Tenant", back_populates="integracoes", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TenantIntegracao(tenant_id={self.tenant_id}, provedor='{self.provedor}', ativo={self.ativo})>"
