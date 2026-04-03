"""
VimaERP 2.0 - Controller: Cobranças.
CRUD + Webhook de integração Asaas.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.cobranca import Cobranca
from app.schemas.cobranca import CobrancaCreate, CobrancaResponse, AsaasWebhookPayload

router = APIRouter(prefix="/api/v1/cobrancas", tags=["Cobranças"])


@router.get("/", response_model=list[CobrancaResponse])
async def listar_cobrancas(
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    filters = {}
    if status:
        filters["status"] = status
    return await Cobranca.where(db=db, limit=limit, offset=offset, **filters)


@router.get("/{cobranca_id}", response_model=CobrancaResponse)
async def buscar_cobranca(
    cobranca_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    cobranca = await Cobranca.find(cobranca_id, db=db)
    if not cobranca:
        raise HTTPException(status_code=404, detail="Cobrança não encontrada")
    return cobranca


@router.post("/", response_model=CobrancaResponse, status_code=201)
async def criar_cobranca(
    data: CobrancaCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Cria cobrança manualmente. Para cobrança via Asaas, use a task assíncrona."""
    cobranca = Cobranca(**data.model_dump())
    await cobranca.save(db=db)
    return cobranca


@router.post("/webhook/asaas")
async def webhook_asaas(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Endpoint público para receber webhooks do Asaas.
    Processa pagamento confirmado, atualiza status da cobrança.
    TODO: Validar assinatura do webhook em produção.
    """
    payload = await request.json()
    event = payload.get("event", "")
    payment = payload.get("payment", {})

    if event == "PAYMENT_CONFIRMED" or event == "PAYMENT_RECEIVED":
        asaas_id = payment.get("id")
        if asaas_id:
            cobranca = await Cobranca.first(db=db, asaas_charge_id=asaas_id)
            if cobranca:
                cobranca.status = "pago"
                await cobranca.save(db=db)

    return {"status": "ok"}
