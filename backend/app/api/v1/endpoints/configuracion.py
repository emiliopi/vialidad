import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import logging

from app.api import deps
from app.models.configuracion import ConfiguracionVialidad
from app.models.user import User
from app.schemas.configuracion import ConfiguracionResponse, ConfiguracionUpdate

logger = logging.getLogger("app.api.v1.endpoints.configuracion")
router = APIRouter()

from pathlib import Path

from app.core.config import settings

# Carpeta local para almacenar las firmas subidas (5 niveles arriba de api/v1/endpoints/)
STATIC_DIR = os.path.join(Path(__file__).resolve().parents[4], "static")
FIRMAS_DIR = os.path.join(STATIC_DIR, "firmas")

# Garantizar que el directorio exista al cargar el módulo
os.makedirs(FIRMAS_DIR, exist_ok=True)

def obtener_o_inicializar_config(db: Session) -> ConfiguracionVialidad:
    """
    Obtiene la configuración única. Si no existe, crea un registro por defecto.
    """
    config = db.query(ConfiguracionVialidad).filter(ConfiguracionVialidad.id == 1).first()
    if not config:
        try:
            config = ConfiguracionVialidad(id=1, precio_vialidad=3.43)
            db.add(config)
            db.commit()
            db.refresh(config)
        except Exception as e:
            db.rollback()
            logger.error(f"Error al inicializar la configuración por defecto: {str(e)}")
            # En caso de concurrencia, re-intentar obtener
            config = db.query(ConfiguracionVialidad).filter(ConfiguracionVialidad.id == 1).first()
    
    if config:
        config.url_verificador = settings.VALIDATOR_URL
    return config

@router.get("/", response_model=ConfiguracionResponse)
def get_configuracion(db: Session = Depends(deps.get_db)):
    """
    Retorna la configuración actual de vialidad (precio y firmas).
    Cualquier usuario autenticado puede consumirlo.
    """
    return obtener_o_inicializar_config(db)

@router.put("/", response_model=ConfiguracionResponse)
def update_configuracion(
    config_in: ConfiguracionUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Actualiza el precio de la vialidad.
    Requiere JWT y rol de administración.
    """
    config = obtener_o_inicializar_config(db)
    try:
        config.precio_vialidad = config_in.precio_vialidad
        if config_in.firma_alcalde_height is not None:
            config.firma_alcalde_height = config_in.firma_alcalde_height
        if config_in.firma_alcalde_top is not None:
            config.firma_alcalde_top = config_in.firma_alcalde_top
        if config_in.firma_secretario_height is not None:
            config.firma_secretario_height = config_in.firma_secretario_height
        if config_in.firma_secretario_top is not None:
            config.firma_secretario_top = config_in.firma_secretario_top
            
        config.codigo_usuario_modificacion = current_user.codigo_usuario
        db.commit()
        db.refresh(config)
        return config
    except Exception as e:
        db.rollback()
        logger.error(f"Error al actualizar la configuración: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al actualizar la configuración."
        )

@router.post("/cargar-firma/{tipo}", response_model=ConfiguracionResponse)
def cargar_firma(
    tipo: str,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Carga el archivo de firma (alcalde o secretario).
    Guarda el archivo en el directorio estático local del backend y actualiza la URL en base de datos.
    """
    if tipo not in ["alcalde", "secretario"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de firma no válido. Debe ser 'alcalde' o 'secretario'."
        )

    # Validar extensión del archivo
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in [".png", ".jpg", ".jpeg", ".svg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo no válido. Solo se permiten imágenes (PNG, JPG, JPEG, SVG)."
        )

    config = obtener_o_inicializar_config(db)

    # Definir nombre de archivo único con UUID para evitar sobrescribir históricos
    import uuid
    filename = f"firma_{tipo}_{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(FIRMAS_DIR, filename)

    try:
        # Guardar archivo localmente
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Ruta accesible públicamente desde la API (ejemplo: /static/firmas/firma_alcalde_1.png)
        file_url = f"/static/firmas/{filename}"

        if tipo == "alcalde":
            config.firma_alcalde_url = file_url
        else:
            config.firma_secretario_url = file_url

        config.codigo_usuario_modificacion = current_user.codigo_usuario
        db.commit()
        db.refresh(config)
        return config
    except Exception as e:
        db.rollback()
        logger.error(f"Error al cargar archivo de firma: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al guardar el archivo en el servidor."
        )

@router.post("/cargar-logo", response_model=ConfiguracionResponse)
def cargar_logo(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Carga el archivo de logo de la tarjeta.
    Guarda el archivo en el directorio estático local del backend y actualiza la URL en base de datos.
    """
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in [".png", ".jpg", ".jpeg", ".svg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo no válido. Solo se permiten imágenes (PNG, JPG, JPEG, SVG)."
        )

    config = obtener_o_inicializar_config(db)

    import uuid
    filename = f"logo_card_{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(STATIC_DIR, filename)

    try:
        # Guardar archivo localmente
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_url = f"/static/{filename}"
        config.logo_card_url = file_url
        config.codigo_usuario_modificacion = current_user.codigo_usuario
        db.commit()
        db.refresh(config)
        return config
    except Exception as e:
        db.rollback()
        logger.error(f"Error al cargar archivo de logo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al guardar el archivo de logo en el servidor."
        )
