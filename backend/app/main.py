import sys
import os
# Asegurar que el directorio raíz del backend esté en el PYTHONPATH para evitar ModuleNotFoundError
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
import uuid
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.database import init_db
from app.core.middleware import SecurityHeadersMiddleware
from app.api.v1.router import api_router

# Configuración del logging básico
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app.main")

# Inicialización de Rate Limiting
limiter = Limiter(key_func=get_remote_address)

# Eventos de Ciclo de Vida (Lifespan) - Estándar Moderno de FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Se ejecuta en el inicio del servidor
    logger.info("Iniciando el servidor FastAPI y conectando a base de datos...")
    init_db()
    yield
    # Se ejecuta al apagar el servidor
    logger.info("Apagando el servidor FastAPI...")

app = FastAPI(
    title="Base Proyecto FastAPI (SQL Server)",
    description="Estructura de backend robusta con autenticación JWT, rate-limiting, seguridad y mejores prácticas.",
    version="1.0.0",
    lifespan=lifespan
)

# 1. Configuración de Rate Limiting
app.state.limiter = limiter

# Montaje de archivos estáticos para subida de archivos segura
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Manejador personalizado de errores de límite de solicitudes
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Demasiadas solicitudes. Por favor, intenta de nuevo más tarde."}
    )

# Manejador global para conflictos de integridad en la base de datos (SQL Server)
@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    logger.error(f"Error de integridad en base de datos: {str(exc)}")
    msg = "Ha ocurrido un conflicto de integridad de datos en el servidor."
    err_str = str(exc).lower()
    if "unique" in err_str or "duplicate" in err_str or "violacion de" in err_str or "key" in err_str:
        msg = "El registro ya existe o un campo único (como usuario o correo) ya está en uso."
    elif "foreign" in err_str or "referencia" in err_str:
        msg = "Error de referencia: El elemento relacionado no existe en el sistema."
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": msg}
    )

# Manejador global de excepciones no controladas para evitar fugas de información
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = uuid.uuid4()
    logger.error(f"Error crítico no controlado [ID: {error_id}]: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": f"Ha ocurrido un error inesperado en el servidor. (ID de rastreo: {error_id})"}
    )

# 2. Inyección del Middleware de Cabeceras de Seguridad
app.add_middleware(SecurityHeadersMiddleware)

# 3. Configuración de CORS
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173", # Puerto por defecto de Vite
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Habilitar cualquier origen local en red privada (192.168.x.x, 10.x.x.x, 172.x.x.x) para pruebas en móviles/otros PCs
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

# 4. Inclusión de Rutas de la API
app.include_router(api_router, prefix="/api")

# 5. Endpoint de Monitoreo de Salud de la API
@app.get("/api/health", tags=["Salud"])
def health_check():
    """
    Endpoint simple de monitoreo que verifica si la API está respondiendo.
    """
    from datetime import datetime, timezone
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT
    }

# Si se ejecuta directamente con Python
if __name__ == "__main__":
    import uvicorn
    logger.info(f"Iniciando Uvicorn en el puerto {settings.PORT}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
