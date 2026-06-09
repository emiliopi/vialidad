from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User, Role
from app.schemas.auth import RegisterRequest
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    decode_token
)
from app.core.config import settings

class AuthService:
    @staticmethod
    def seed_roles_and_users(db: Session) -> None:
        """
        Garantiza la existencia de los roles (Super Admin, Admin) y crea un usuario por defecto para cada uno.
        Las contraseñas se leen desde las variables de entorno SEED_SUPERADMIN_PASSWORD y SEED_ADMIN_PASSWORD.
        """
        import logging
        seed_logger = logging.getLogger("app.services.auth.seed")

        # 1. Sembrar Roles
        super_admin_role = db.get(Role, 1)
        if not super_admin_role:
            super_admin_role = Role(codigo_rol=1, nombre="Super Admin")
            db.add(super_admin_role)

        admin_role = db.get(Role, 2)
        if not admin_role:
            admin_role = Role(codigo_rol=2, nombre="Admin")
            db.add(admin_role)
        
        db.commit()

        # Alertar si se están usando contraseñas de seed por defecto (solo desarrollo)
        default_super = "ChangeMe!SuperAdmin1"
        default_admin = "ChangeMe!Admin1"
        if settings.SEED_SUPERADMIN_PASSWORD == default_super or settings.SEED_ADMIN_PASSWORD == default_admin:
            seed_logger.warning(
                "⚠️  ATENCIÓN: Se están usando contraseñas de seed por defecto. "
                "Define SEED_SUPERADMIN_PASSWORD y SEED_ADMIN_PASSWORD en tu .env antes de ir a producción."
            )

        # 2. Sembrar Usuarios por defecto si no existen
        super_admin_user = db.scalar(select(User).where(User.usuario == "superadmin"))
        if not super_admin_user:
            from app.core.security import get_password_hash
            new_super = User(
                usuario="superadmin",
                email="super@gmail.com",
                password=get_password_hash(settings.SEED_SUPERADMIN_PASSWORD),
                codigo_rol=1,
                intentos_login=0
            )
            db.add(new_super)

        admin_user = db.scalar(select(User).where(User.usuario == "admin"))
        if not admin_user:
            from app.core.security import get_password_hash
            new_admin = User(
                usuario="admin",
                email="admin@gmail.com",
                password=get_password_hash(settings.SEED_ADMIN_PASSWORD),
                codigo_rol=2,
                intentos_login=0
            )
            db.add(new_admin)
        
        db.commit()

        # 3. Sembrar Menús por defecto
        from app.models.menu import Menu
        default_menus = [
            {"label": "Inicio", "path": "/dashboard", "icon": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"},
            {"label": "Vialidades", "path": "/vialidades", "icon": "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},
            {"label": "Usuarios", "path": "/usuarios", "icon": "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0"},
            {"label": "Configuración", "path": "/configuracion", "icon": "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"},
            {"label": "Permisos", "path": "/permisos", "icon": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"}
        ]

        # Eliminar de la base de datos menús obsoletos que ya no estén en default_menus
        paths_validos = [m["path"] for m in default_menus]
        db.query(Menu).filter(Menu.path.notin_(paths_validos)).delete(synchronize_session=False)
        db.commit()

        db_menus = []
        for menu_info in default_menus:
            menu_obj = db.scalar(select(Menu).where(Menu.path == menu_info["path"]))
            if not menu_obj:
                menu_obj = Menu(label=menu_info["label"], path=menu_info["path"], icon=menu_info["icon"])
                db.add(menu_obj)
                db.flush()
            else:
                menu_obj.icon = menu_info["icon"]
                menu_obj.label = menu_info["label"]
            db_menus.append(menu_obj)
        db.commit()

        # 4. Asignar menús a Roles
        # Super Admin (ID 1) tiene todos los menús
        super_admin_role = db.get(Role, 1)
        if super_admin_role:
            super_admin_role.menus = db_menus
        
        # Admin (ID 2) tiene acceso a un subset (excluyendo Usuarios y Permisos)
        admin_role = db.get(Role, 2)
        if admin_role:
            admin_role.menus = [m for m in db_menus if m.path not in ["/usuarios", "/permisos"]]
        
        db.commit()

    @staticmethod
    def get_role_name_by_id(db: Session, codigo_rol: int) -> str:
        """
        Retorna el nombre de un rol por su código o 'Usuario' por defecto.
        """
        role = db.get(Role, codigo_rol)
        return role.nombre if role else "Usuario"

    @staticmethod
    def login(db: Session, username: str, password_plain: str) -> dict:
        # Asegurarse de que los roles y usuarios básicos existen
        AuthService.seed_roles_and_users(db)

        # Buscar usuario por nombre de usuario o email
        user_stmt = select(User).where((User.usuario == username) | (User.email == username))
        user = db.scalar(user_stmt)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )

        # 1. Verificar bloqueo por intentos fallidos
        if user.intentos_login >= settings.MAX_LOGIN_ATTEMPTS:
            if user.ultimo_intento_login:
                # Usar timezone-aware datetime para el cálculo del bloqueo
                lockout_end = user.ultimo_intento_login.replace(tzinfo=timezone.utc) + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
                now = datetime.now(timezone.utc)
                if now < lockout_end:
                    remaining_seconds = int((lockout_end - now).total_seconds())
                    remaining_minutes = max(1, remaining_seconds // 60)
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Cuenta bloqueada temporalmente. Intenta de nuevo en {remaining_minutes} minutos."
                    )
                else:
                    # El tiempo de bloqueo ya expiró, reseteamos intentos
                    user.intentos_login = 0
                    db.commit()

        # 2. Verificar contraseña
        if not verify_password(password_plain, user.password):
            # Registrar intento fallido
            user.intentos_login += 1
            user.ultimo_intento_login = datetime.now(timezone.utc).replace(tzinfo=None)
            db.commit()

            attempts_left = max(0, settings.MAX_LOGIN_ATTEMPTS - user.intentos_login)
            if attempts_left == 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Cuenta bloqueada por seguridad por {settings.LOCKOUT_DURATION_MINUTES} minutos."
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Credenciales inválidas. Te quedan {attempts_left} intentos."
            )

        # 3. Generar tokens en caso de éxito
        role_name = AuthService.get_role_name_by_id(db, user.codigo_rol)
        access_token = create_access_token(subject=str(user.codigo_usuario))
        refresh_token = create_refresh_token(subject=str(user.codigo_usuario))

        # 4. Actualizar estado del usuario en BD
        user.refresh_token = refresh_token
        user.intentos_login = 0
        user.ultimo_intento_login = None
        db.commit()

        # Consultar menús permitidos para el rol
        user_menus = [
            {"label": m.label, "path": m.path, "icon": m.icon}
            for m in user.rol.menus
        ]
        
        # Ordenar de acuerdo a la prioridad de rutas solicitada
        orden_rutas = [
            "/dashboard",
            "/catalog",
            "/dev-guide",
            "/vialidades",
            "/usuarios",
            "/configuracion",
            "/permisos"
        ]
        user_menus.sort(key=lambda x: orden_rutas.index(x["path"]) if x["path"] in orden_rutas else 999)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.codigo_usuario),
                "username": user.usuario,
                "email": user.email,
                "role": role_name,
                "menus": user_menus
            }
        }

    @staticmethod
    def register(db: Session, req: RegisterRequest) -> dict:
        # Asegurarse de que los roles y usuarios básicos existen
        AuthService.seed_roles_and_users(db)

        # Verificar si el nombre de usuario ya existe
        user_exists = db.scalar(select(User).where(User.usuario == req.username))
        if user_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está registrado"
            )

        # Verificar si el email ya existe
        email_exists = db.scalar(select(User).where(User.email == req.email))
        if email_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado"
            )

        # Crear nuevo usuario
        # SEGURIDAD: El rol siempre es asignado por el servidor (Admin = 2, el de menor privilegio).
        # Para asignar roles más elevados, usar el endpoint /api/v1/users/ que requiere Super Admin.
        hashed_password = get_password_hash(req.password)
        new_user = User(
            usuario=req.username,
            email=req.email,
            password=hashed_password,
            codigo_rol=2,  # Siempre Admin (menor privilegio) en el registro público
            intentos_login=0
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        role_name = AuthService.get_role_name_by_id(db, new_user.codigo_rol)

        return {
            "id": str(new_user.codigo_usuario),
            "username": new_user.usuario,
            "email": new_user.email,
            "role": role_name
        }

    @staticmethod
    def refresh(db: Session, refresh_token: str) -> dict:
        # Decodificar el token y verificar validez
        payload = decode_token(refresh_token, settings.REFRESH_SECRET_KEY)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de actualización inválido o expirado"
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de actualización inválido"
            )

        # Buscar usuario en BD y verificar que coincida con el refresh token persistido
        user = db.get(User, int(user_id))
        if not user or user.refresh_token != refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sesión inválida o expirada"
            )

        # Generar nuevos tokens (Rotación de tokens de actualización)
        new_access_token = create_access_token(subject=str(user.codigo_usuario))
        new_refresh_token = create_refresh_token(subject=str(user.codigo_usuario))

        user.refresh_token = new_refresh_token
        db.commit()

        return {
            "access_token": new_access_token,
            "new_refresh_token": new_refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def logout(db: Session, current_user: User) -> None:
        """
        Invalida el refresh token del usuario en la base de datos.
        Así, aunque alguien tenga el token robado, no podrá renovar acceso.
        """
        current_user.refresh_token = None
        db.commit()
