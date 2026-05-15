"""Pydantic schemas para biometría."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EnrollmentResponse(BaseModel):
    template_id: uuid.UUID
    owner_id: uuid.UUID
    finger: str
    minutiae_count: int
    image_quality_score: float | None = None
    algorithm_version: str
    enrolled_at: datetime

    model_config = {"from_attributes": True}


class VerificationResponse(BaseModel):
    verification_id: uuid.UUID
    contract_id: uuid.UUID | None = None
    result: str  # MATCH, NO_MATCH, POOR_QUALITY
    score: float
    threshold_used: float
    minutiae_matched: int
    minutiae_query: int
    minutiae_template: int
    processing_ms: int
    match: bool

    model_config = {"from_attributes": True}


class BiometricHistoryItem(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID | None = None
    result: str
    score: float
    threshold_used: float
    minutiae_matched: int
    algorithm_version: str
    processing_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}
