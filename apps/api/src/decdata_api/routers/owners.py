"""Owners router — CRUD de dueños de fundos."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from decdata_api.core.dependencies import get_current_user, require_admin
from decdata_api.db import get_db
from decdata_api.models.user import User
from decdata_api.models.owner import Owner
from decdata_api.schemas.owner import OwnerCreate, OwnerResponse

router = APIRouter()


@router.get("/", response_model=list[OwnerResponse])
async def list_owners(
    fundo_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar dueños, opcionalmente filtrar por fundo."""
    query = select(Owner).where(Owner.is_active == True)
    if fundo_id:
        query = query.where(Owner.fundo_id == fundo_id)
    result = await db.execute(query.order_by(Owner.last_name))
    return [OwnerResponse.model_validate(o) for o in result.scalars().all()]


@router.get("/{owner_id}", response_model=OwnerResponse)
async def get_owner(
    owner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener un dueño por ID."""
    result = await db.execute(select(Owner).where(Owner.id == owner_id))
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Dueño no encontrado")
    return OwnerResponse.model_validate(owner)


@router.post("/", response_model=OwnerResponse, status_code=201)
async def create_owner(
    body: OwnerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Registrar un nuevo dueño para un fundo."""
    # Verificar que no exista otro dueño activo para ese fundo
    existing = await db.execute(
        select(Owner).where(Owner.fundo_id == body.fundo_id, Owner.is_active == True)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El fundo ya tiene un dueño activo")

    owner = Owner(**body.model_dump())
    db.add(owner)
    await db.flush()
    await db.refresh(owner)
    return OwnerResponse.model_validate(owner)
