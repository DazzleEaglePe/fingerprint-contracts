"""Audit router — consulta de historial de auditoría."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from decdata_api.core.dependencies import get_current_user
from decdata_api.db import get_db
from decdata_api.models.user import User
from decdata_api.models.biometric_verification import BiometricVerification
from decdata_api.models.audit_log import AuditLog
from decdata_api.schemas.biometric import BiometricHistoryItem

router = APIRouter()


@router.get("/biometric-history", response_model=list[BiometricHistoryItem])
async def biometric_history(
    owner_id: uuid.UUID | None = None,
    contract_id: uuid.UUID | None = None,
    result: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Consultar historial de verificaciones biométricas."""
    query = select(BiometricVerification)

    if owner_id:
        query = query.where(BiometricVerification.owner_id == owner_id)
    if contract_id:
        query = query.where(BiometricVerification.contract_id == contract_id)
    if result:
        query = query.where(BiometricVerification.result == result)

    query = query.order_by(BiometricVerification.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    db_result = await db.execute(query)
    return [BiometricHistoryItem.model_validate(v) for v in db_result.scalars().all()]
