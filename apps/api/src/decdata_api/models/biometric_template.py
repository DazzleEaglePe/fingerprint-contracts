"""Biometric template model — plantillas maestras de minutiae."""

import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from decdata_api.models.base import Base, TimestampMixin


class BiometricTemplate(Base, TimestampMixin):
    __tablename__ = "biometric_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), nullable=False
    )
    finger: Mapped[str] = mapped_column(String(20), nullable=False, default="RIGHT_THUMB")
    minutiae: Mapped[dict] = mapped_column(JSONB, nullable=False)
    minutiae_count: Mapped[int] = mapped_column(Integer, nullable=False)
    image_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_quality_score: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    algorithm_version: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    owner = relationship("Owner", back_populates="biometric_template")
