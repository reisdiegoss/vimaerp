"""
VimaERP 2.0 - Controller: PDV (Ponto de Venda).
Abertura/fechamento de caixa e fechamento de venda.
Operações complexas delegadas ao VendaService e CaixaService.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.schemas.caixa import AbrirCaixaRequest, FecharCaixaRequest, CaixaSessaoResponse
from app.schemas.venda import FecharVendaRequest, VendaResponse
from app.services.caixa_service import CaixaService
from app.services.venda_service import VendaService

router = APIRouter(prefix="/api/v1/pdv", tags=["PDV"])


@router.post("/abrir-caixa", response_model=CaixaSessaoResponse, status_code=201)
async def abrir_caixa(
    data: AbrirCaixaRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Abre uma nova sessão de caixa para o usuário logado."""
    sessao = await CaixaService.abrir_sessao(
        db=db,
        usuario_id=user.id,
        saldo_inicial=data.saldo_inicial,
    )
    return sessao


@router.post("/fechar-caixa/{sessao_id}", response_model=CaixaSessaoResponse)
async def fechar_caixa(
    sessao_id: str,
    data: FecharCaixaRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Fecha uma sessão de caixa."""
    sessao = await CaixaService.fechar_sessao(
        db=db,
        sessao_id=sessao_id,
        saldo_final=data.saldo_final,
    )
    return sessao


@router.post("/vender", response_model=VendaResponse, status_code=201)
async def fechar_venda(
    data: FecharVendaRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Fecha uma venda no PDV.
    Operação atômica: cria venda, itens e abate estoque em uma única transação.
    """
    venda = await VendaService.fechar_venda(
        db=db,
        usuario_id=user.id,
        data=data,
    )
    return venda
