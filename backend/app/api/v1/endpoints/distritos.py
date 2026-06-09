from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.api import deps
from app.models.user import User
from app.models.distrito import Distrito
from app.schemas.distrito import DistritoCreate, DistritoUpdate, DistritoResponse, DistritoPaginationResponse
import logging

logger = logging.getLogger("app.api.v1.endpoints.distritos")
router = APIRouter()

@router.get("/", response_model=DistritoPaginationResponse)
def get_distritos(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    page: int = Query(default=1, ge=1, description="Número de página"),
    limit: int = Query(default=10, ge=1, le=100, description="Registros por página"),
    search: str = Query(default="", max_length=100, description="Buscar por nombre")
):
    """
    Lista todos los distritos de forma paginada y con filtro de búsqueda.
    """
    try:
        skip = (page - 1) * limit if page > 0 else 0
        query = db.query(Distrito)
        
        if search:
            query = query.filter(Distrito.nombre.ilike(f"%{search}%"))
            
        total = query.count()
        items = query.order_by(Distrito.codigo_distrito.asc()).offset(skip).limit(limit).all()
        
        return {"items": items, "total": total}
    except Exception as e:
        logger.error(f"Error al listar distritos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la consulta de distritos en el servidor."
        )

@router.get("/{id}", response_model=DistritoResponse)
def get_distrito(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Obtiene un distrito específico por su ID.
    """
    db_obj = db.get(Distrito, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El distrito especificado no existe."
        )
    return db_obj

@router.post("/", response_model=DistritoResponse, status_code=status.HTTP_201_CREATED)
def create_distrito(
    distrito_in: DistritoCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Crea un nuevo distrito.
    """
    # Validar que no exista un distrito con el mismo nombre
    existing = db.query(Distrito).filter(Distrito.nombre.ilike(distrito_in.nombre)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un distrito registrado con ese nombre."
        )

    try:
        db_obj = Distrito(
            nombre=distrito_in.nombre,
            activo=distrito_in.activo,
            codigo_usuario_creacion=current_user.codigo_usuario
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Error al crear distrito: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar el distrito en el servidor."
        )

@router.put("/{id}", response_model=DistritoResponse)
def update_distrito(
    id: int,
    distrito_in: DistritoUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Actualiza la información de un distrito.
    """
    db_obj = db.get(Distrito, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El distrito especificado no existe."
        )

    if distrito_in.nombre and distrito_in.nombre.lower() != db_obj.nombre.lower():
        existing = db.query(Distrito).filter(Distrito.nombre.ilike(distrito_in.nombre)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe otro distrito registrado con ese nombre."
            )

    try:
        if distrito_in.nombre is not None:
            db_obj.nombre = distrito_in.nombre
        if distrito_in.activo is not None:
            db_obj.activo = distrito_in.activo
            
        db_obj.codigo_usuario_modificacion = current_user.codigo_usuario
        # Forzar onupdate disparado por SQLAlchemy o reescribir fecha_modificacion explícitamente para asegurar
        from datetime import datetime, timezone
        db_obj.fecha_modificacion = datetime.now(timezone.utc).replace(tzinfo=None)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Error al actualizar distrito con ID {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el distrito en el servidor."
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_distrito(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Elimina físicamente un distrito.
    """
    db_obj = db.get(Distrito, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El distrito especificado no existe."
        )

    try:
        db.delete(db_obj)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error al eliminar distrito con ID {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se puede eliminar el distrito. Es posible que esté relacionado a otros registros del sistema."
        )
