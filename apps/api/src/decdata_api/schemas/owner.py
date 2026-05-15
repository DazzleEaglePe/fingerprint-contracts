"""Pydantic schemas para owners."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class OwnerCreate(BaseModel):
    fundo_id: uuid.UUID
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    document_type: str = Field(default="DNI", max_length=20)
    document_number: str = Field(..., max_length=20)
    birth_date: date | None = None
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = None


class OwnerResponse(BaseModel):
    id: uuid.UUID
    fundo_id: uuid.UUID
    first_name: str
    last_name: str
    document_type: str
    document_number: str
    birth_date: date | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
