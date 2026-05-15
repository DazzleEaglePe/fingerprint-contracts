"""Contracts router — CRUD de contratos."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from decdata_api.core.dependencies import get_current_user, require_admin
from decdata_api.db import get_db
from decdata_api.models.user import User
from decdata_api.models.contract import Contract
from decdata_api.models.contract_party import ContractParty
from decdata_api.models.contract_clause import ContractClause
from decdata_api.models.contract_type import ContractType
from decdata_api.schemas.contract import (
    ContractCreate,
    ContractResponse,
    ContractUpdate,
    ContractTypeResponse,
)

router = APIRouter()


@router.get("/types", response_model=list[ContractTypeResponse])
async def list_contract_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar tipos de contrato."""
    result = await db.execute(
        select(ContractType).where(ContractType.is_active == True).order_by(ContractType.name)
    )
    return [ContractTypeResponse.model_validate(ct) for ct in result.scalars().all()]


@router.get("/", response_model=list[ContractResponse])
async def list_contracts(
    fundo_id: uuid.UUID | None = None,
    status: str | None = None,
    contract_type_id: uuid.UUID | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar contratos con filtros opcionales."""
    query = select(Contract).where(Contract.deleted_at == None)

    if fundo_id:
        query = query.where(Contract.fundo_id == fundo_id)
    if status:
        query = query.where(Contract.status == status)
    if contract_type_id:
        query = query.where(Contract.contract_type_id == contract_type_id)

    query = query.order_by(Contract.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    return [ContractResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener un contrato por ID."""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return ContractResponse.model_validate(contract)


@router.post("/", response_model=ContractResponse, status_code=201)
async def create_contract(
    body: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Crear un nuevo contrato en estado DRAFT."""
    contract = Contract(
        fundo_id=body.fundo_id,
        contract_type_id=body.contract_type_id,
        code=body.code,
        title=body.title,
        description=body.description,
        start_date=body.start_date,
        end_date=body.end_date,
        amount=body.amount,
        currency=body.currency,
        payment_terms=body.payment_terms,
        notes=body.notes,
        status="DRAFT",
        created_by=current_user.id,
    )
    db.add(contract)
    await db.flush()

    # Agregar partes si vienen
    if body.parties:
        for party_data in body.parties:
            party = ContractParty(contract_id=contract.id, **party_data.model_dump())
            db.add(party)

    # Agregar cláusulas si vienen
    if body.clauses:
        for clause_data in body.clauses:
            clause = ContractClause(contract_id=contract.id, **clause_data.model_dump())
            db.add(clause)

    await db.flush()
    await db.refresh(contract)
    return ContractResponse.model_validate(contract)


@router.patch("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: uuid.UUID,
    body: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Actualizar un contrato (solo si está en DRAFT)."""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    if contract.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Solo se pueden editar contratos en borrador")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contract, key, value)

    await db.flush()
    await db.refresh(contract)
    return ContractResponse.model_validate(contract)


@router.delete("/{contract_id}", status_code=204)
async def delete_contract(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Soft delete de un contrato (solo DRAFT)."""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    if contract.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar borradores")

    contract.deleted_at = datetime.now(timezone.utc)
