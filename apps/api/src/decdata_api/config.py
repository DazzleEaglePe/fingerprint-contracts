"""Configuración centralizada de la aplicación usando Pydantic Settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://decdata:decdata_dev_pwd@localhost:5433/decdata"

    # Security
    JWT_SECRET: str = "change-me-in-production-min-32-chars-please"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 8
    BCRYPT_COST: int = 12

    # Biometric
    MATCH_THRESHOLD: float = 0.45
    ALGORITHM_VERSION: str = "v1.0-gabor-zhang-suen"
    MAX_IMAGE_SIZE_MB: int = 5
    ALLOWED_IMAGE_FORMATS: str = "png,jpg,jpeg,bmp,tif"

    # Storage
    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "./storage"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_formats_list(self) -> list[str]:
        return [fmt.strip() for fmt in self.ALLOWED_IMAGE_FORMATS.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Devuelve la instancia cacheada de settings."""
    return Settings()
