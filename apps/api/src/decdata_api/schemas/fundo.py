"""Pydantic schemas para fundos."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class FundoCreate(BaseModel):
    name: str = Field(..., max_length=200)
    legal_name: str | None = Field(default=None, max_length=255)
    ruc: str | None = Field(default=None, max_length=11)
    address: str | None = None
    region: str | None = Field(default=None, max_length=100)
    province: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    total_hectares: float | None = None
    main_crops: list[str] | None = None
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=255)


class FundoResponse(BaseModel):
    id: uuid.UUID
    name: str
    legal_name: str | None = None
    ruc: str | None = None
    address: str | None = None
    region: str | None = None
    province: str | None = None
    district: str | None = None
    total_hectares: float | None = None
    main_crops: list[str] | None = None
    phone: str | None = None
    email: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FundoUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    legal_name: str | None = None
    ruc: str | None = None
    address: str | None = None
    region: str | None = None
    province: str | None = None
    district: str | None = None
    total_hectares: float | None = None
    main_crops: list[str] | None = None
    phone: str | None = None
    email: str | None = None
