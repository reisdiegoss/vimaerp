from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import date, datetime

class AsaasPaymentSchema(BaseModel):
    """Mapeamento do objeto 'payment' dentro do webhook do Asaas."""
    id: str
    customer: str
    status: str
    value: float
    netValue: float
    billingType: str
    confirmedDate: Optional[date] = None
    paymentDate: Optional[date] = None
    originalValue: Optional[float] = None
    interestValue: Optional[float] = None
    clientPaymentDate: Optional[date] = None
    invoiceUrl: Optional[str] = None
    invoiceNumber: Optional[str] = None
    externalReference: Optional[str] = None

class AsaasWebhookPayload(BaseModel):
    """Payload principal enviado pelo Asaas via Webhook."""
    id: str
    event: str
    dateCreated: datetime
    payment: AsaasPaymentSchema
