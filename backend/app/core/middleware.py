from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware de cabeceras de seguridad HTTP.
    - Reemplaza la cabecera X-XSS-Protection (obsoleta y peligrosa) por Content-Security-Policy.
    - Añade HSTS en producción para forzar HTTPS.
    - Mantiene todas las demás cabeceras defensivas.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Previene que la página sea abierta en un frame/iframe (Clickjacking)
        response.headers["X-Frame-Options"] = "DENY"

        # Fuerza al navegador a no adivinar el tipo MIME (XSS/Sniffing)
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Política de referencia (mínima exposición de información)
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restricción de características del navegador
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # Content Security Policy: reemplaza el obsoleto X-XSS-Protection.
        # Ajusta los orígenes según las CDN o fuentes externas reales de tu proyecto.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "   # unsafe-inline necesario para Vite en dev
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )

        # HSTS: fuerza HTTPS durante 1 año. Solo activo en producción para no romper desarrollo local.
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response
