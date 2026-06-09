from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.api import deps
from app.models.user import User
from app.models.concepto import Concepto
from app.schemas.concepto import ConceptoCreate, ConceptoUpdate, ConceptoResponse, ConceptoPaginationResponse
import logging

logger = logging.getLogger("app.api.v1.endpoints.conceptos")
router = APIRouter()

@router.get("/", response_model=ConceptoPaginationResponse)
def get_conceptos(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    page: int = Query(default=1, ge=1, description="Número de página"),
    limit: int = Query(default=10, ge=1, le=100, description="Registros por página"),
    search: str = Query(default="", max_length=100, description="Buscar por nombre")
):
    """
    Lista todos los conceptos de forma paginada y con filtro de búsqueda.
    """
    try:
        skip = (page - 1) * limit if page > 0 else 0
        query = db.query(Concepto)
        
        if search:
            query = query.filter(Concepto.nombre.ilike(f"%{search}%"))
            
        total = query.count()
        items = query.order_by(Concepto.codigo_concepto.asc()).offset(skip).limit(limit).all()
        
        return {"items": items, "total": total}
    except Exception as e:
        logger.error(f"Error al listar conceptos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la consulta de conceptos en el servidor."
        )

@router.get("/{id}", response_model=ConceptoResponse)
def get_concepto(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Obtiene un concepto específico por su ID.
    """
    db_obj = db.get(Concepto, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El concepto especificado no existe."
        )
    return db_obj

@router.post("/", response_model=ConceptoResponse, status_code=status.HTTP_201_CREATED)
def create_concepto(
    concepto_in: ConceptoCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Crea un nuevo concepto.
    """
    existing = db.query(Concepto).filter(Concepto.nombre.ilike(concepto_in.nombre)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un concepto registrado con ese nombre."
        )

    try:
        db_obj = Concepto(
            nombre=concepto_in.nombre,
            activo=concepto_in.activo,
            codigo_usuario_creacion=current_user.codigo_usuario
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Error al crear concepto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar el concepto en el servidor."
        )

@router.put("/{id}", response_model=ConceptoResponse)
def update_concepto(
    id: int,
    concepto_in: ConceptoUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Actualiza la información de un concepto.
    """
    db_obj = db.get(Concepto, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El concepto especificado no existe."
        )

    if concepto_in.nombre and concepto_in.nombre.lower() != db_obj.nombre.lower():
        existing = db.query(Concepto).filter(Concepto.nombre.ilike(concepto_in.nombre)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe otro concepto registrado con ese nombre."
            )

    try:
        if concepto_in.nombre is not None:
            db_obj.nombre = concepto_in.nombre
        if concepto_in.activo is not None:
            db_obj.activo = concepto_in.activo
            
        db_obj.codigo_usuario_modificacion = current_user.codigo_usuario
        from datetime import datetime, timezone
        db_obj.fecha_modificacion = datetime.now(timezone.utc).replace(tzinfo=None)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Error al actualizar concepto con ID {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el concepto en el servidor."
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_concepto(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Elimina físicamente un concepto.
    """
    db_obj = db.get(Concepto, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El concepto especificado no existe."
        )

    try:
        db.delete(db_obj)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error al eliminar concepto con ID {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se puede eliminar el concepto. Es posible que esté relacionado a otros registros del sistema."
        )
