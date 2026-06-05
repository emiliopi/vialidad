from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
import bcrypt

from app.api import deps
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserUpdate, UserResponseDetail, UserPaginationResponse, RoleResponse
import logging

logger = logging.getLogger("app.api.v1.endpoints.users")
router = APIRouter()

@router.get("/roles", response_model=list[RoleResponse])
def get_roles(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Obtiene todos los roles del sistema.
    """
    try:
        return db.query(Role).all()
    except Exception as e:
        logger.error(f"Error al obtener roles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la consulta de roles."
        )

@router.get("/", response_model=UserPaginationResponse)
def get_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    page: int = Query(default=1, ge=1, description="Número de página (mínimo 1)"),
    limit: int = Query(default=10, ge=1, le=100, description="Registros por página (máximo 100)"),
    search: str = Query(default="", max_length=100, description="Término de búsqueda")
):
    """
    Lista todos los usuarios de forma paginada y con filtros del lado del servidor (SQL Server).
    Requiere token JWT activo.
    """
    try:
        # Calcular el desplazamiento (skip) para paginación
        skip = (page - 1) * limit if page > 0 else 0
        
        query = db.query(User)
        
        # Filtro de búsqueda (Buscador Server-Side)
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (User.usuario.ilike(search_filter)) | 
                (User.email.ilike(search_filter))
            )
            
        # Conteo total para la paginación del cliente
        total = query.count()
        
        # Obtener los elementos paginados ordenados por código de usuario
        items = query.order_by(User.codigo_usuario.asc()).offset(skip).limit(limit).all()
        
        return {"items": items, "total": total}
    except Exception as e:
        logger.error(f"Error al listar usuarios con paginación server-side: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al consultar los usuarios en el servidor."
        )

@router.post("/", response_model=UserResponseDetail, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_role(["Super Admin"]))
):
    """
    Crea un nuevo usuario en el sistema.
    """
    # 1. Validar que no exista el nombre de usuario
    existing_username = db.query(User).filter(User.usuario == user_in.usuario).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está registrado."
        )
        
    # 2. Validar que no exista el correo electrónico
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )
        
    # 3. Validar existencia del rol
    role = db.get(Role, user_in.codigo_rol)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol especificado no existe."
        )

    try:
        # 4. Hashing seguro nativo
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(user_in.password.encode('utf-8'), salt).decode('utf-8')
        
        # 5. Insertar
        db_obj = User(
            usuario=user_in.usuario,
            email=user_in.email,
            password=hashed_password,
            codigo_rol=user_in.codigo_rol
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Error al registrar usuario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar el registro del usuario."
        )

@router.put("/{id}", response_model=UserResponseDetail)
def update_user(
    id: int,
    user_in: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_role(["Super Admin"]))
):
    """
    Actualiza la información de un usuario existente.
    """
    db_obj = db.get(User, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario especificado no existe."
        )
        
    # Validar duplicados de usuario excluyendo al actual
    if user_in.usuario and user_in.usuario != db_obj.usuario:
        existing = db.query(User).filter(User.usuario == user_in.usuario).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso por otra cuenta."
            )
            
    # Validar duplicados de correo electrónico excluyendo al actual
    if user_in.email and user_in.email != db_obj.email:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está en uso por otra cuenta."
            )
            
    # Validar existencia del rol si se modifica
    if user_in.codigo_rol is not None:
        role = db.get(Role, user_in.codigo_rol)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El rol especificado no existe."
            )

    try:
        # Modificaciones
        if user_in.usuario:
            db_obj.usuario = user_in.usuario
        if user_in.email:
            db_obj.email = user_in.email
        if user_in.codigo_rol is not None:
            db_obj.codigo_rol = user_in.codigo_rol
        if user_in.intentos_login is not None:
            db_obj.intentos_login = user_in.intentos_login
            
        # Hashing de nueva contraseña si viene especificada
        if user_in.password:
            salt = bcrypt.gensalt()
            db_obj.password = bcrypt.hashpw(user_in.password.encode('utf-8'), salt).decode('utf-8')
            
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Error al editar usuario con ID {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la actualización del usuario."
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_role(["Super Admin"]))
):
    """
    Elimina un usuario por su ID de base de datos.
    Regla de negocio: Bloquea que el usuario logueado se auto-elimine.
    """
    # 1. Regla crítica de negocio: Bloquear auto-eliminación
    if id == current_user.codigo_usuario:
        logger.warning(f"Usuario {current_user.usuario} intentó eliminarse a sí mismo.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta de usuario activo."
        )
        
    db_obj = db.get(User, id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario especificado no existe."
        )
        
    try:
        db.delete(db_obj)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error al eliminar usuario con ID {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de base de datos al intentar eliminar el usuario."
        )
