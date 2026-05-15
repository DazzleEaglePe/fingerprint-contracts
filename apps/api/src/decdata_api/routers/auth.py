"""Auth router — login and user registration."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from decdata_api.core.dependencies import get_current_user, require_admin
from decdata_api.core.security import hash_password, verify_password, create_access_token
from decdata_api.db import get_db
from decdata_api.models.user import User
from decdata_api.schemas.user import LoginRequest, LoginResponse, UserCreate, UserResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Autenticar usuario y devolver JWT."""
    result = await db.execute(
        select(User).where(User.email == body.email, User.is_active == True, User.deleted_at == None)
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    # Actualizar último login
    user.last_login_at = datetime.utcnow()

    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Registrar un nuevo operador (solo admin)."""
    # Verificar que el email no exista
    existing = await db.execute(
        select(User).where(User.email == body.email, User.deleted_at == None)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Obtener datos del usuario autenticado."""
    return UserResponse.model_validate(current_user)
