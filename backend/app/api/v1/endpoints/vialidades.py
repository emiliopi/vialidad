from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

from app.api import deps
from app.models.vialidad import Vialidad
from app.models.user import User
from app.schemas.vialidad import VialidadCreate, VialidadResponse, VialidadVerifyResponse

logger = logging.getLogger("app.api.v1.endpoints.vialidades")
router = APIRouter()

@router.post("/", response_model=VialidadResponse, status_code=status.HTTP_201_CREATED)
def create_vialidad(
    vialidad_in: VialidadCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Guarda el registro de una nueva vialidad impresa.
    Requiere token JWT activo.
    """
    # Validar si ya existe la llave única
    existing = db.query(Vialidad).filter(Vialidad.llave_unica == vialidad_in.llave_unica).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La llave única especificada ya está registrada."
        )

    try:
        db_obj = Vialidad(
            llave_unica=vialidad_in.llave_unica,
            numero_recibo=vialidad_in.numero_recibo,
            nombre=vialidad_in.nombre,
            distrito=vialidad_in.distrito,
            concepto=vialidad_in.concepto,
            fecha_emision=vialidad_in.fecha_emision,
            fecha_expiracion=vialidad_in.fecha_expiracion,
            con_marca_agua=vialidad_in.con_marca_agua,
            max_visualizaciones=vialidad_in.max_visualizaciones,
            visualizaciones_restantes=vialidad_in.max_visualizaciones, # Inicializa con el máximo
            codigo_usuario_creacion=current_user.codigo_usuario
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Error al registrar boleta de vialidad: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar el guardado de la vialidad."
        )

@router.get("/verificar/{llave}", response_model=VialidadVerifyResponse)
def verify_vialidad(
    llave: str,
    numero_recibo: str,
    db: Session = Depends(deps.get_db)
):
    """
    Verifica un documento de vialidad públicamente usando su llave única y número de recibo.
    Resta 1 al contador de visualizaciones restantes en cada lectura exitosa.
    """
    vialidad = db.query(Vialidad).filter(
        Vialidad.llave_unica == llave,
        Vialidad.numero_recibo == numero_recibo
    ).first()
    
    if not vialidad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Los datos de verificación son incorrectos o el documento no existe."
        )

    # Validar si quedan visualizaciones
    if vialidad.visualizaciones_restantes <= 0:
        return VialidadVerifyResponse(
            exitoso=False,
            mensaje="Se ha alcanzado el límite máximo de visualizaciones permitidas para este documento.",
            visualizaciones_restantes=0,
            datos=None
        )

    try:
        # Decrementar visualizaciones restantes
        vialidad.visualizaciones_restantes -= 1
        vialidad.fecha_modificacion = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.add(vialidad)
        db.commit()
        db.refresh(vialidad)

        return VialidadVerifyResponse(
            exitoso=True,
            mensaje="Verificación exitosa del documento.",
            visualizaciones_restantes=vialidad.visualizaciones_restantes,
            datos=vialidad
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error al verificar la vialidad {llave}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la verificación."
        )
