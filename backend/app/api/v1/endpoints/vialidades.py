from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional
import logging

from app.api import deps
from app.models.vialidad import Vialidad
from app.models.user import User
from app.schemas.vialidad import VialidadCreate, VialidadResponse, VialidadVerifyResponse, VialidadPaginationResponse

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

    # Obtener configuración actual para guardar la instantánea (snapshot)
    from app.models.configuracion import ConfiguracionVialidad
    config = db.query(ConfiguracionVialidad).filter(ConfiguracionVialidad.id == 1).first()
    precio = config.precio_vialidad if config else 3.43
    alcalde_url = config.firma_alcalde_url if config else None
    secretario_url = config.firma_secretario_url if config else None

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
            codigo_usuario_creacion=current_user.codigo_usuario,
            precio_vialidad=precio,
            firma_alcalde_url=alcalde_url,
            firma_secretario_url=secretario_url
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

@router.get("/estadisticas")
def get_vialidades_estadisticas(
    fecha_inicio: Optional[str] = Query(default=None),
    fecha_fin: Optional[str] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Obtiene métricas estadísticas agregadas para las vialidades emitidas en un rango de fechas.
    """
    from datetime import datetime
    from collections import Counter
    
    query = db.query(Vialidad)
    if fecha_inicio:
        try:
            start_date = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            query = query.filter(Vialidad.fecha_creacion >= start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha_inicio inválido. Use YYYY-MM-DD.")
    if fecha_fin:
        try:
            end_date = datetime.strptime(fecha_fin, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(Vialidad.fecha_creacion <= end_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha_fin inválido. Use YYYY-MM-DD.")

    try:
        vialidades = query.all()
        total_historico = db.query(Vialidad).count()
        
        total_periodo = len(vialidades)
        
        # Agregaciones en memoria
        distritos_counter = Counter()
        conceptos_counter = Counter()
        timeline_counter = Counter()
        
        for v in vialidades:
            distrito_name = v.distrito or "No especificado"
            distritos_counter[distrito_name] += 1
            
            conceptos_counter[v.concepto] += 1
            
            date_str = v.fecha_creacion.strftime("%Y-%m-%d")
            timeline_counter[date_str] += 1
            
        distritos = [
            {"distrito": name, "total": count}
            for name, count in distritos_counter.most_common()
        ]
        
        conceptos = [
            {"concepto": name, "total": count}
            for name, count in conceptos_counter.most_common()
        ]
        
        timeline = [
            {"fecha": date, "total": count}
            for date, count in sorted(timeline_counter.items(), reverse=True)
        ]
        
        return {
            "total_periodo": total_periodo,
            "total_historico": total_historico,
            "distritos": distritos,
            "conceptos": conceptos,
            "timeline": timeline
        }
    except Exception as e:
        logger.error(f"Error al calcular estadísticas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al calcular estadísticas en el servidor."
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

@router.get("/", response_model=VialidadPaginationResponse)
def get_vialidades(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    search: str = Query(default="")
):
    """
    Lista las boletas de vialidad de forma paginada con buscador server-side.
    Requiere token JWT activo.
    """
    try:
        skip = (page - 1) * limit if page > 0 else 0
        query = db.query(Vialidad)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Vialidad.nombre.ilike(search_filter)) |
                (Vialidad.numero_recibo.ilike(search_filter)) |
                (Vialidad.llave_unica.ilike(search_filter))
            )
            
        total = query.count()
        items = query.order_by(Vialidad.codigo_vialidad.desc()).offset(skip).limit(limit).all()
        
        return {"items": items, "total": total}
    except Exception as e:
        logger.error(f"Error al listar vialidades: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al consultar las vialidades en el servidor."
        )
