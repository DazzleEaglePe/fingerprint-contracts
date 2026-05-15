"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from decdata_api.config import get_settings
from decdata_api.db.session import engine
from decdata_api.models.base import Base
from decdata_api.routers import auth, fundos, owners, contracts, biometric, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: crea tablas al iniciar (dev only)."""
    settings = get_settings()
    # En desarrollo, crear tablas automáticamente.
    # En producción, usar Alembic migrations.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    """Factory de la aplicación FastAPI."""
    settings = get_settings()

    app = FastAPI(
        title="DecData Contratos API",
        description="Sistema de Gestión de Contratos con Validación Biométrica por Huella Digital",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
    app.include_router(fundos.router, prefix="/api/fundos", tags=["Fundos"])
    app.include_router(owners.router, prefix="/api/owners", tags=["Owners"])
    app.include_router(contracts.router, prefix="/api/contracts", tags=["Contracts"])
    app.include_router(biometric.router, prefix="/api/biometric", tags=["Biometric"])
    app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])

    @app.get("/api/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "version": "0.1.0"}

    return app


app = create_app()
