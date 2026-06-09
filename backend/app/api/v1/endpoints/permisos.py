from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import logging

from app.api import deps
from app.models.user import Role, User
from app.models.menu import Menu, roles_menus

logger = logging.getLogger("app.api.v1.endpoints.permisos")
router = APIRouter()

def es_super_admin(current_user: User = Depends(deps.get_current_user)) -> None:
    """
    Verifica que el usuario logueado tenga el rol 'Super Admin' (ID 1).
    """
    if current_user.codigo_rol != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación restringida. Se requieren privilegios de Super Admin."
        )

@router.get("/roles")
def get_roles(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Lista todos los roles del sistema.
    """
    roles = db.query(Role).all()
    return [{"codigo_rol": r.codigo_rol, "nombre": r.nombre} for r in roles]

@router.get("/menus")
def get_menus(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Lista todos los menús registrados en el sistema.
    """
    menus = db.query(Menu).all()
    return [{"codigo_menu": m.codigo_menu, "label": m.label, "path": m.path} for m in menus]

@router.get("/roles/{codigo_rol}/menus")
def get_role_menus(
    codigo_rol: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Obtiene los IDs de los menús asignados a un rol específico.
    """
    role = db.get(Role, codigo_rol)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El rol especificado no existe."
        )
    return [menu.codigo_menu for menu in role.menus]

@router.put("/roles/{codigo_rol}/menus")
def update_role_menus(
    codigo_rol: int,
    menu_ids: List[int],
    db: Session = Depends(deps.get_db),
    admin_check = Depends(es_super_admin)
):
    """
    Actualiza la asociación de menús de un rol.
    Reemplaza todos los permisos existentes por los nuevos IDs enviados.
    Requiere ser Super Admin.
    """
    role = db.get(Role, codigo_rol)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El rol especificado no existe."
        )

    try:
        # Obtener los nuevos menús de la base de datos
        nuevos_menus = db.query(Menu).filter(Menu.codigo_menu.in_(menu_ids)).all()
        
        # Actualizar la relación secundaria
        role.menus = nuevos_menus
        db.commit()
        return {"mensaje": "Permisos de menú actualizados con éxito."}
    except Exception as e:
        db.rollback()
        logger.error(f"Error al actualizar permisos de rol {codigo_rol}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al guardar los cambios en la base de datos."
        )
