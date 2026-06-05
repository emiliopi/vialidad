import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PORT: int = Field(default=8000)
    ENVIRONMENT: str = Field(default="development")

    # --- Campos sin default: el servidor NO arrancará si no están en el .env ---
    DATABASE_URL: str = Field(
        description="Cadena de conexión a SQL Server. Requerido en .env"
    )
    SECRET_KEY: str = Field(
        description="Clave secreta para firmar Access Tokens JWT. Requerido en .env"
    )
    REFRESH_SECRET_KEY: str = Field(
        description="Clave secreta para firmar Refresh Tokens JWT. Requerido en .env"
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    # Intentos fallidos y bloqueo
    MAX_LOGIN_ATTEMPTS: int = Field(default=5)
    LOCKOUT_DURATION_MINUTES: int = Field(default=5)

    # Contraseñas del seed de usuarios iniciales (leer desde .env, no hardcodear)
    SEED_SUPERADMIN_PASSWORD: str = Field(default="ChangeMe!SuperAdmin1")
    SEED_ADMIN_PASSWORD: str = Field(default="ChangeMe!Admin1")

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
