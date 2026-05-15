"""Pydantic schemas para contratos."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class ContractCreate(BaseModel):
    fundo_id: uuid.UUID
    contract_type_id: uuid.UUID
    code: str = Field(..., max_length=50)
    title: str = Field(..., max_length=300)
    description: str | None = None
    start_date: date
    end_date: date
    amount: float | None = None
    currency: str = Field(default="PEN", max_length=3)
    payment_terms: str | None = None
    notes: str | None = None
    parties: list["ContractPartyCreate"] | None = None
    clauses: list["ContractClauseCreate"] | None = None


class ContractResponse(BaseModel):
    id: uuid.UUID
    fundo_id: uuid.UUID
    contract_type_id: uuid.UUID
    code: str
    title: str
    description: str | None = None
    status: str
    start_date: date
    end_date: date
    signed_at: datetime | None = None
    amount: float | None = None
    currency: str
    payment_terms: str | None = None
    biometric_score: float | None = None
    notes: str | None = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContractUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    amount: float | None = None
    currency: str | None = None
    payment_terms: str | None = None
    notes: str | None = None


class ContractPartyCreate(BaseModel):
    party_type: str = Field(..., pattern="^(INDIVIDUAL|COMPANY)$")
    party_role: str = Field(default="COUNTERPARTY", pattern="^(OWNER|COUNTERPARTY)$")
    full_name: str = Field(..., max_length=255)
    document_type: str = Field(..., max_length=20)
    document_number: str = Field(..., max_length=20)
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    legal_rep_name: str | None = None
    legal_rep_document: str | None = None


class ContractClauseCreate(BaseModel):
    order_index: int = Field(..., gt=0)
    title: str = Field(..., max_length=255)
    content: str


class ContractTypeResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}
