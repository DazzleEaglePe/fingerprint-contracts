"""Contract party model — partes involucradas en cada contrato."""

import uuid

from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from decdata_api.models.base import Base, TimestampMixin


class ContractParty(Base, TimestampMixin):
    __tablename__ = "contract_parties"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False
    )
    party_type: Mapped[str] = mapped_column(String(20), nullable=False)  # INDIVIDUAL, COMPANY
    party_role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="COUNTERPARTY"
    )  # OWNER, COUNTERPARTY

    # Identificación
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(20), nullable=False)
    document_number: Mapped[str] = mapped_column(String(20), nullable=False)

    # Contacto
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Representante legal (si party_type = COMPANY)
    legal_rep_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    legal_rep_document: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Relationships
    contract = relationship("Contract", back_populates="parties")
