from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import decode_token
from app.models.user import User
import logging

logger = logging.getLogger("app.api.deps")

# Utilidad para extraer el token Bearer de la cabecera Authorization
security_scheme = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    """
    Dependencia de inyección para obtener la sesión de base de datos local de SQLAlchemy.
    Garantiza el cierre automático de la conexión tras finalizar el request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> User:
    """
    Dependencia para validar el token JWT en la cabecera y retornar el usuario actual.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_token(token, settings.SECRET_KEY)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identificador de usuario inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.get(User, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar que la cuenta no esté bloqueada por intentos fallidos
    if user.intentos_login >= settings.MAX_LOGIN_ATTEMPTS:
        if user.ultimo_intento_login:
            from datetime import datetime, timezone, timedelta
            lockout_end = user.ultimo_intento_login.replace(tzinfo=timezone.utc) + timedelta(
                minutes=settings.LOCKOUT_DURATION_MINUTES
            )
            if datetime.now(timezone.utc) < lockout_end:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cuenta bloqueada temporalmente. Acceso denegado.",
                )

    return user

def require_role(allowed_roles: list[str]):
    """
    Dependencia para validar que el usuario actual tenga uno de los roles permitidos.
    """
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.rol or current_user.rol.nombre not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción."
            )
        return current_user
    return dependency

