from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
import logging

from app.api import deps
from app.models.vialidad import Vialidad
from app.models.user import User
from app.schemas.vialidad import VialidadCreate, VialidadResponse, VialidadVerifyResponse, VialidadPaginationResponse, VialidadBulkCreate, VialidadBulkResponse, RegisterBulkPrint
from app.services.pdf_generator import generar_pdf_vialidad

logger = logging.getLogger("app.api.v1.endpoints.vialidades")
router = APIRouter()

@router.get("/siguiente-recibo")
def get_siguiente_recibo(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retorna el siguiente número de recibo correlativo disponible.
    """
    ultimo = db.query(Vialidad).order_by(Vialidad.codigo_vialidad.desc()).first()
    if ultimo and ultimo.numero_recibo and ultimo.numero_recibo.isdigit():
        siguiente = str(int(ultimo.numero_recibo) + 1)
    else:
        siguiente = "100001"
    return {"siguiente": siguiente}

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


    # Obtener o autogenerar la llave única
    llave = vialidad_in.llave_unica
    if not llave:
        import random
        while True:
            now = datetime.now()
            # Formato: VIA-YYYY-MMDDHHMMSS (ej: VIA-2026-0610141720)
            timestamp_str = now.strftime("%m%d%H%M%S")
            llave_candidata = f"VIA-{now.year}-{timestamp_str}"
            existing_llave = db.query(Vialidad).filter(Vialidad.llave_unica == llave_candidata).first()
            if not existing_llave:
                llave = llave_candidata
                break
            else:
                # Sufijo aleatorio de seguridad por colisión extrema de concurrencia
                rand_suffix = random.randint(10, 99)
                llave = f"VIA-{now.year}-{timestamp_str}{rand_suffix}"
                break
    else:
        # Validar si ya existe la llave única especificada
        existing = db.query(Vialidad).filter(Vialidad.llave_unica == llave).first()
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
            llave_unica=llave.upper() if llave else None,
            numero_recibo="TEMP",
            nombre=vialidad_in.nombre.upper() if vialidad_in.nombre else None,
            distrito=vialidad_in.distrito.upper() if vialidad_in.distrito else None,
            concepto=vialidad_in.concepto.upper() if vialidad_in.concepto else None,
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
        db.flush()
        
        ultimo = db.query(Vialidad).filter(
            Vialidad.codigo_vialidad < db_obj.codigo_vialidad,
            Vialidad.numero_recibo != "TEMP"
        ).order_by(Vialidad.codigo_vialidad.desc()).first()
        
        if ultimo and ultimo.numero_recibo and ultimo.numero_recibo.isdigit():
            offset = int(ultimo.numero_recibo) - ultimo.codigo_vialidad
        else:
            offset = 100000
            
        db_obj.numero_recibo = str(offset + db_obj.codigo_vialidad)
        
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
    search: str = Query(default=""),
    distrito: Optional[str] = Query(default=None),
    concepto: Optional[str] = Query(default=None)
):
    """
    Lista las boletas de vialidad de forma paginada con buscador server-side.
    Requiere token JWT activo.
    """
    try:
        from sqlalchemy import cast, String
        skip = (page - 1) * limit if page > 0 else 0
        query = db.query(Vialidad)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Vialidad.nombre.ilike(search_filter)) |
                (Vialidad.numero_recibo.ilike(search_filter)) |
                (Vialidad.llave_unica.ilike(search_filter)) |
                (cast(Vialidad.fecha_emision, String).ilike(search_filter))
            )
            
        if distrito:
            query = query.filter(Vialidad.distrito.ilike(distrito))
            
        if concepto:
            query = query.filter(Vialidad.concepto.ilike(concepto))
            
        total = query.count()
        items = query.order_by(Vialidad.codigo_vialidad.desc()).offset(skip).limit(limit).all()
        
        return {"items": items, "total": total}
    except Exception as e:
        logger.error(f"Error al listar vialidades: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al consultar las vialidades en el servidor."
        )

@router.get("/{llave}/pdf")
def get_vialidad_pdf(
    llave: str,
    request: Request,
    numero_recibo: Optional[str] = Query(default=None),
    url_verificador: Optional[str] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Genera la boleta de vialidad y retorna el archivo PDF codificado en Base64.
    Si se provee el numero_recibo, valida que coincida.
    """
    try:
        query = db.query(Vialidad).filter(Vialidad.llave_unica == llave)
        if numero_recibo:
            query = query.filter(Vialidad.numero_recibo == numero_recibo)
            
        vialidad = query.first()
        if not vialidad:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La boleta de vialidad especificada no existe."
            )
            
        # Resolver la URL del verificador QR
        from app.core.config import settings
        resolved_url = url_verificador or settings.VALIDATOR_URL
        
        # Si la URL configurada apunta a localhost/127.0.0.1 pero la petición viene de otra IP/Host (ej. red local o DNS),
        # adaptamos dinámicamente localhost a la IP/Host de la petición para que el código QR funcione correctamente.
        if "localhost" in resolved_url or "127.0.0.1" in resolved_url:
            request_host = request.headers.get("host")
            if request_host:
                hostname = request_host.split(":")[0]
                if hostname not in ("localhost", "127.0.0.1"):
                    resolved_url = resolved_url.replace("localhost", hostname).replace("127.0.0.1", hostname)
            
        pdf_buffer = generar_pdf_vialidad(vialidad, url_verificador=resolved_url)
        
        import base64 as b64
        pdf_bytes = pdf_buffer.getvalue()
        pdf_b64 = b64.b64encode(pdf_bytes).decode("utf-8")
        return {"pdf_base64": pdf_b64}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al generar/descargar PDF de vialidad {llave}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al generar el archivo PDF."
        )


@router.post("/bulk", response_model=VialidadBulkResponse, status_code=status.HTTP_201_CREATED)
def create_vialidades_bulk(
    payload: VialidadBulkCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Registra múltiples vialidades en una sola transacción.
    Genera llave_unica y numero_recibo secuencial para cada ítem.
    Máx. 500 ítems por solicitud.
    """
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La lista de ítems no puede estar vacía.")

    from app.models.configuracion import ConfiguracionVialidad
    import random

    config = db.query(ConfiguracionVialidad).filter(ConfiguracionVialidad.id == 1).first()
    precio = config.precio_vialidad if config else 3.43
    alcalde_url = config.firma_alcalde_url if config else None
    secretario_url = config.firma_secretario_url if config else None

    now = datetime.now()
    current_year = now.year
    default_fecha_expiracion = datetime(current_year, 12, 31, 23, 59, 59)
    codigo_lote = f"LOTE-{now.strftime('%Y%m%d-%H%M%S')}"

    created_objects = []
    try:
        for idx, item in enumerate(payload.items):
            # Generar llave única evitando colisiones dentro del mismo batch
            import time
            timestamp_str = datetime.now().strftime("%m%d%H%M%S")
            rand_suffix = random.randint(10, 99)
            llave = f"VIA-{current_year}-{timestamp_str}{rand_suffix}{idx}"

            fecha_emision = item.fecha_emision or datetime.now()
            fecha_expiracion = item.fecha_expiracion or default_fecha_expiracion

            db_obj = Vialidad(
                llave_unica=llave.upper(),
                numero_recibo="TEMP",
                nombre=item.nombre.upper(),
                distrito=item.distrito.upper() if item.distrito else None,
                concepto=item.concepto.upper(),
                fecha_emision=fecha_emision,
                fecha_expiracion=fecha_expiracion,
                con_marca_agua=item.con_marca_agua,
                max_visualizaciones=item.max_visualizaciones,
                visualizaciones_restantes=item.max_visualizaciones,
                codigo_usuario_creacion=current_user.codigo_usuario,
                precio_vialidad=precio,
                firma_alcalde_url=alcalde_url,
                firma_secretario_url=secretario_url,
                codigo_lote=codigo_lote
            )
            db.add(db_obj)
            db.flush()  # Obtener codigo_vialidad asignado por la BD

            # Calcular numero_recibo secuencial igual que la creación individual
            ultimo = db.query(Vialidad).filter(
                Vialidad.codigo_vialidad < db_obj.codigo_vialidad,
                Vialidad.numero_recibo != "TEMP"
            ).order_by(Vialidad.codigo_vialidad.desc()).first()

            if ultimo and ultimo.numero_recibo and ultimo.numero_recibo.isdigit():
                offset = int(ultimo.numero_recibo) - ultimo.codigo_vialidad
            else:
                offset = 100000

            db_obj.numero_recibo = str(offset + db_obj.codigo_vialidad)
            created_objects.append(db_obj)

        db.commit()
        for obj in created_objects:
            db.refresh(obj)

        return VialidadBulkResponse(total_creados=len(created_objects), items=created_objects)

    except Exception as e:
        db.rollback()
        logger.error(f"Error en carga masiva de vialidades: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la carga masiva de vialidades."
        )


@router.post("/{codigo_vialidad}/registrar-impresion", response_model=VialidadResponse)
def registrar_impresion(
    codigo_vialidad: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Registra el evento de impresión de una vialidad individual (incrementa contador, actualiza fecha y usuario).
    """
    vialidad = db.query(Vialidad).filter(Vialidad.codigo_vialidad == codigo_vialidad).first()
    if not vialidad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vialidad no encontrada."
        )
    
    vialidad.impreso = True
    vialidad.veces_impresa += 1
    vialidad.fecha_ultima_impresion = datetime.now()
    vialidad.codigo_usuario_ultima_impresion = current_user.codigo_usuario
    
    db.commit()
    db.refresh(vialidad)
    return vialidad


@router.post("/registrar-impresion-lote", response_model=List[VialidadResponse])
def registrar_impresion_lote(
    payload: RegisterBulkPrint,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Registra el evento de impresión para un lote de vialidades.
    """
    vialidades = db.query(Vialidad).filter(Vialidad.codigo_vialidad.in_(payload.codigos)).all()
    now = datetime.now()
    for v in vialidades:
        v.impreso = True
        v.veces_impresa += 1
        v.fecha_ultima_impresion = now
        v.codigo_usuario_ultima_impresion = current_user.codigo_usuario
    db.commit()
    for v in vialidades:
        db.refresh(v)
    return vialidades


@router.get("/lotes/{codigo_lote}", response_model=List[VialidadResponse])
def get_vialidades_lote(
    codigo_lote: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Obtiene todas las vialidades pertenecientes a un lote específico.
    """
    return db.query(Vialidad).filter(Vialidad.codigo_lote == codigo_lote).all()
