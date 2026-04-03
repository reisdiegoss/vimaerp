"""VimaERP 2.0 - Schemas: Fiscal (NFe/NFCe)."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class EmitirNfeRequest(BaseModel):
    venda_id: str
    ambiente: str = "homologacao"  # homologacao, producao


class NotaFiscalResponse(BaseModel):
    id: str
    venda_id: Optional[str] = None
    chave_acesso: Optional[str] = None
    protocolo_autorizacao: Optional[str] = None
    pdf_path: Optional[str] = None
    status: str
    ambiente: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
