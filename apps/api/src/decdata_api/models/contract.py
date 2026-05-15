"""Contract model — contratos del fundo."""

import uuid
from datetime import date, datetime

from sqlalchemy import String, Numeric, Text, Date, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from decdata_api.models.base import Base, TimestampMixin, SoftDeleteMixin


class Contract(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    fundo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fundos.id", ondelete="RESTRICT"), nullable=False
    )
    contract_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contract_types.id", ondelete="RESTRICT"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="DRAFT")

    # Fechas
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    signed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Económico
    amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="PEN")
    payment_terms: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Firma biométrica
    signed_by_owner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id"), nullable=True
    )
    biometric_verification_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("biometric_verifications.id", ondelete="SET NULL"),
        nullable=True,
    )
    biometric_score: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)

    # Renovación
    renewed_from_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True
    )

    # Metadatos
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Trazabilidad
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    fundo = relationship("Fundo", back_populates="contracts")
    contract_type = relationship("ContractType", back_populates="contracts")
    parties = relationship("ContractParty", back_populates="contract", cascade="all, delete-orphan")
    clauses = relationship("ContractClause", back_populates="contract", cascade="all, delete-orphan")
