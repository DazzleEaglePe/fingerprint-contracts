"""Fundo model — fundos agrícolas."""

import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Numeric, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from decdata_api.models.base import Base, TimestampMixin, SoftDeleteMixin


class Fundo(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "fundos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ruc: Mapped[str | None] = mapped_column(String(11), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    total_hectares: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    main_crops: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    owner = relationship("Owner", back_populates="fundo", uselist=False)
    contracts = relationship("Contract", back_populates="fundo")
