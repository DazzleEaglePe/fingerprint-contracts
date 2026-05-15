"""Fundos router — CRUD de fundos agrícolas."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from decdata_api.core.dependencies import get_current_user, require_admin
from decdata_api.db import get_db
from decdata_api.models.user import User
from decdata_api.models.fundo import Fundo
from decdata_api.schemas.fundo import FundoCreate, FundoResponse, FundoUpdate

router = APIRouter()


@router.get("/", response_model=list[FundoResponse])
async def list_fundos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar todos los fundos activos."""
    result = await db.execute(
        select(Fundo).where(Fundo.deleted_at == None, Fundo.is_active == True).order_by(Fundo.name)
    )
    return [FundoResponse.model_validate(f) for f in result.scalars().all()]


@router.get("/{fundo_id}", response_model=FundoResponse)
async def get_fundo(
    fundo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener un fundo por ID."""
    result = await db.execute(
        select(Fundo).where(Fundo.id == fundo_id, Fundo.deleted_at == None)
    )
    fundo = result.scalar_one_or_none()
    if not fundo:
        raise HTTPException(status_code=404, detail="Fundo no encontrado")
    return FundoResponse.model_validate(fundo)


@router.post("/", response_model=FundoResponse, status_code=201)
async def create_fundo(
    body: FundoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Crear un nuevo fundo."""
    fundo = Fundo(**body.model_dump())
    db.add(fundo)
    await db.flush()
    await db.refresh(fundo)
    return FundoResponse.model_validate(fundo)


@router.patch("/{fundo_id}", response_model=FundoResponse)
async def update_fundo(
    fundo_id: uuid.UUID,
    body: FundoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Actualizar un fundo."""
    result = await db.execute(
        select(Fundo).where(Fundo.id == fundo_id, Fundo.deleted_at == None)
    )
    fundo = result.scalar_one_or_none()
    if not fundo:
        raise HTTPException(status_code=404, detail="Fundo no encontrado")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(fundo, key, value)

    await db.flush()
    await db.refresh(fundo)
    return FundoResponse.model_validate(fundo)


@router.delete("/{fundo_id}", status_code=204)
async def delete_fundo(
    fundo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Soft delete de un fundo."""
    from datetime import datetime, timezone

    result = await db.execute(
        select(Fundo).where(Fundo.id == fundo_id, Fundo.deleted_at == None)
    )
    fundo = result.scalar_one_or_none()
    if not fundo:
        raise HTTPException(status_code=404, detail="Fundo no encontrado")

    fundo.deleted_at = datetime.now(timezone.utc)
