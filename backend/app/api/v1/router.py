from fastapi import APIRouter
from app.api.v1.endpoints import auth, utils, users, vialidades, configuracion, permisos, distritos, conceptos

api_router = APIRouter()

# Incluimos los endpoints de autenticación bajo el prefijo /auth
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])

# Incluimos los endpoints de utilidades bajo el prefijo /utils
api_router.include_router(utils.router, prefix="/utils", tags=["Utilidades"])

# Incluimos los endpoints de gestión de usuarios bajo el prefijo /users
api_router.include_router(users.router, prefix="/users", tags=["Usuarios"])

# Incluimos los endpoints de vialidades bajo el prefijo /vialidades
api_router.include_router(vialidades.router, prefix="/vialidades", tags=["Vialidades"])

# Incluimos los endpoints de configuración bajo el prefijo /configuracion
api_router.include_router(configuracion.router, prefix="/configuracion", tags=["Configuración"])

# Incluimos los endpoints de permisos bajo el prefijo /permisos
api_router.include_router(permisos.router, prefix="/permisos", tags=["Permisos"])

# Incluimos los endpoints de distritos bajo el prefijo /distritos
api_router.include_router(distritos.router, prefix="/distritos", tags=["Distritos"])

# Incluimos los endpoints de conceptos bajo el prefijo /conceptos
api_router.include_router(conceptos.router, prefix="/conceptos", tags=["Conceptos"])



