"""Biometric verification model — historial de intentos de validación."""

import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from decdata_api.models.base import Base


class BiometricVerification(Base):
    __tablename__ = "biometric_verifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    contract_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="RESTRICT"), nullable=False
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("biometric_templates.id", ondelete="RESTRICT"),
        nullable=False,
    )
    initiated_by_user: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    # Resultado
    result: Mapped[str] = mapped_column(String(20), nullable=False)  # MATCH, NO_MATCH, POOR_QUALITY
    score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    threshold_used: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    minutiae_matched: Mapped[int] = mapped_column(Integer, nullable=False)
    minutiae_query: Mapped[int] = mapped_column(Integer, nullable=False)
    minutiae_template: Mapped[int] = mapped_column(Integer, nullable=False)

    # Pipeline info
    algorithm_version: Mapped[str] = mapped_column(String(50), nullable=False)
    processing_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    image_quality_score: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)

    # Auditoría
    query_image_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
