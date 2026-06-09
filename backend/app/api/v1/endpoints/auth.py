from fastapi import APIRouter, Depends, Request, Response, Cookie, status
from typing import Optional
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.schemas.auth import (
    LoginRequest, 
    RegisterRequest, 
    TokenResponse, 
    TokenRefreshResponse,
    UserResponse
)
from app.services.auth import AuthService
from app.models.user import User
from app.core.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Configuración de la cookie de refresh token
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # en segundos


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """
    Establece el refresh token como cookie httpOnly, SameSite=Lax.
    httpOnly impide el acceso desde JavaScript (protección contra XSS).
    """
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,                              # ← Inaccesible por JS
        samesite="lax",                             # ← Protección CSRF básica
        secure=settings.ENVIRONMENT == "production", # ← HTTPS solo en producción
        max_age=REFRESH_COOKIE_MAX_AGE,
        path="/",                          # ← Cambiado a '/' para evitar fallas de ruta en localhost
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, response: Response, req_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Inicia sesión. Devuelve el access_token en el body y el refresh_token
    como cookie httpOnly (inaccesible por JavaScript, protección XSS).
    """
    result = AuthService.login(db, username=req_data.username, password_plain=req_data.password)

    # Mover el refresh_token del body a una cookie httpOnly segura
    _set_refresh_cookie(response, result["refresh_token"])
    result.pop("refresh_token", None)  # No exponer el refresh token en el body

    return result


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, req_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario. El rol es siempre el de menor privilegio (Admin),
    independientemente de lo que envíe el cliente.
    """
    result = AuthService.register(db, req_data)
    return result


@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh_token(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token_cookie: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE_NAME)
):
    """
    Renueva el Access Token usando el Refresh Token de la cookie httpOnly.
    También rota el refresh token (nueva cookie) para mayor seguridad.
    """
    if not refresh_token_cookie:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token de actualización"
        )

    result = AuthService.refresh(db, refresh_token=refresh_token_cookie)

    # Rotar la cookie con el nuevo refresh token
    _set_refresh_cookie(response, result["new_refresh_token"])

    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"]
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cierra la sesión: invalida el refresh token en BD y elimina la cookie del navegador.
    Aunque alguien robe la cookie antes del logout, el token ya no será válido en BD.
    """
    AuthService.logout(db, current_user)

    # Expirar la cookie en el navegador del cliente
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
    )
    return None


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Obtiene los detalles del perfil del usuario actualmente autenticado.
    """
    role_name = AuthService.get_role_name_by_id(db, current_user.codigo_rol)
    user_menus = [
        {"label": m.label, "path": m.path, "icon": m.icon}
        for m in current_user.rol.menus
    ]
    return {
        "id": str(current_user.codigo_usuario),
        "username": current_user.usuario,
        "email": current_user.email,
        "role": role_name,
        "menus": user_menus
    }
