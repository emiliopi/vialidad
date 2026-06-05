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

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.codigo_usuario),
                "username": user.usuario,
                "email": user.email,
                "role": role_name
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
