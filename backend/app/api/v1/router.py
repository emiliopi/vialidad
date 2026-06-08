from fastapi import APIRouter
from app.api.v1.endpoints import auth, utils, users, vialidades

api_router = APIRouter()

# Incluimos los endpoints de autenticación bajo el prefijo /auth
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])

# Incluimos los endpoints de utilidades bajo el prefijo /utils
api_router.include_router(utils.router, prefix="/utils", tags=["Utilidades"])

# Incluimos los endpoints de gestión de usuarios bajo el prefijo /users
api_router.include_router(users.router, prefix="/users", tags=["Usuarios"])

# Incluimos los endpoints de vialidades bajo el prefijo /vialidades
api_router.include_router(vialidades.router, prefix="/vialidades", tags=["Vialidades"])

