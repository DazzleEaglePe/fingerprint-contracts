"""Biometric router — enrollment y verificación de huellas digitales."""

import uuid
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from decdata_api.config import get_settings
from decdata_api.core.dependencies import get_current_user, require_admin
from decdata_api.db import get_db
from decdata_api.models.user import User
from decdata_api.models.owner import Owner
from decdata_api.models.contract import Contract
from decdata_api.models.biometric_template import BiometricTemplate
from decdata_api.models.biometric_verification import BiometricVerification
from decdata_api.schemas.biometric import EnrollmentResponse, VerificationResponse
from decdata_api.biometric.pipeline import BiometricPipeline

router = APIRouter()
settings = get_settings()
pipeline = BiometricPipeline()


@router.post("/enroll/{owner_id}", response_model=EnrollmentResponse)
async def enroll_fingerprint(
    owner_id: uuid.UUID,
    finger: str = Form(default="RIGHT_THUMB"),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Registrar la huella digital de un dueño (enrollment)."""
    # Verificar que el owner existe
    result = await db.execute(select(Owner).where(Owner.id == owner_id, Owner.is_active == True))
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Dueño no encontrado")

    # Leer la imagen
    image_bytes = await image.read()

    # Procesar con el pipeline biométrico
    try:
        template_data = pipeline.extract_template(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error procesando la huella: {str(e)}")

    if template_data["minutiae_count"] == 0:
        raise HTTPException(status_code=400, detail="No se detectaron minutiae en la imagen")

    # Desactivar plantilla anterior si existe
    existing = await db.execute(
        select(BiometricTemplate).where(
            BiometricTemplate.owner_id == owner_id,
            BiometricTemplate.finger == finger,
            BiometricTemplate.is_active == True,
        )
    )
    old_template = existing.scalar_one_or_none()
    if old_template:
        raise HTTPException(status_code=400, detail="Este dueño ya se encuentra enrolado con una huella activa.")

    # Crear nueva plantilla
    template = BiometricTemplate(
        owner_id=owner_id,
        finger=finger,
        minutiae=template_data["minutiae"],
        minutiae_count=template_data["minutiae_count"],
        image_quality_score=template_data.get("quality_score"),
        algorithm_version=settings.ALGORITHM_VERSION,
        is_active=True,
        enrolled_at=datetime.now(timezone.utc),
    )
    db.add(template)
    await db.flush()
    await db.refresh(template)

    return EnrollmentResponse(
        template_id=template.id,
        owner_id=template.owner_id,
        finger=template.finger,
        minutiae_count=template.minutiae_count,
        image_quality_score=template.image_quality_score,
        algorithm_version=template.algorithm_version,
        enrolled_at=template.enrolled_at,
    )


@router.post("/verify/{contract_id}", response_model=VerificationResponse)
async def verify_fingerprint(
    contract_id: uuid.UUID,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Verificar huella digital para firmar un contrato."""
    start_time = time.time()

    # Obtener contrato
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    if contract.status not in ["DRAFT", "PENDING_SIGNATURE"]:
        raise HTTPException(status_code=400, detail="Solo se pueden firmar contratos en borrador o pendientes de firma")

    # Obtener owner del fundo
    result = await db.execute(
        select(Owner).where(Owner.fundo_id == contract.fundo_id, Owner.is_active == True)
    )
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=400, detail="El fundo no tiene dueño registrado")

    # Obtener plantilla maestra
    result = await db.execute(
        select(BiometricTemplate).where(
            BiometricTemplate.owner_id == owner.id, BiometricTemplate.is_active == True
        )
    )
    master_template = result.scalar_one_or_none()
    if not master_template:
        raise HTTPException(
            status_code=400, detail="El dueño no tiene plantilla biométrica registrada"
        )

    # Leer imagen y procesar
    image_bytes = await image.read()

    try:
        query_data = pipeline.extract_template(image_bytes)
    except Exception as e:
        # Registrar intento fallido por calidad
        processing_ms = int((time.time() - start_time) * 1000)
        verification = BiometricVerification(
            contract_id=contract_id,
            owner_id=owner.id,
            template_id=master_template.id,
            initiated_by_user=current_user.id,
            result="POOR_QUALITY",
            score=0.0,
            threshold_used=settings.MATCH_THRESHOLD,
            minutiae_matched=0,
            minutiae_query=0,
            minutiae_template=master_template.minutiae_count,
            algorithm_version=settings.ALGORITHM_VERSION,
            processing_ms=processing_ms,
            created_at=datetime.now(timezone.utc),
        )
        db.add(verification)
        raise HTTPException(status_code=400, detail=f"Imagen de baja calidad: {str(e)}")

    # Ejecutar matching
    match_result = pipeline.match(query_data["minutiae"], master_template.minutiae)
    processing_ms = int((time.time() - start_time) * 1000)

    is_match = match_result["score"] >= settings.MATCH_THRESHOLD
    result_str = "MATCH" if is_match else "NO_MATCH"

    # Registrar verificación
    verification = BiometricVerification(
        contract_id=contract_id,
        owner_id=owner.id,
        template_id=master_template.id,
        initiated_by_user=current_user.id,
        result=result_str,
        score=match_result["score"],
        threshold_used=settings.MATCH_THRESHOLD,
        minutiae_matched=match_result["matched"],
        minutiae_query=match_result["query_count"],
        minutiae_template=match_result["template_count"],
        algorithm_version=settings.ALGORITHM_VERSION,
        processing_ms=processing_ms,
        created_at=datetime.now(timezone.utc),
    )
    db.add(verification)
    await db.flush()

    # Si match, firmar contrato
    if is_match:
        contract.status = "SIGNED"
        contract.signed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        contract.signed_by_owner_id = owner.id
        contract.biometric_verification_id = verification.id
        contract.biometric_score = match_result["score"]
        db.add(contract)
    
    await db.commit()

    return VerificationResponse(
        verification_id=verification.id,
        contract_id=contract_id,
        result=result_str,
        score=match_result["score"],
        threshold_used=settings.MATCH_THRESHOLD,
        minutiae_matched=match_result["matched"],
        minutiae_query=match_result["query_count"],
        minutiae_template=match_result["template_count"],
        processing_ms=processing_ms,
        match=is_match,
    )
