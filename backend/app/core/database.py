from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger("app.database")

# Creamos el motor de base de datos
# pool_pre_ping=True verifica que la conexión esté activa antes de usarla (muy útil para SQL Server)
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.critical(f"Error al configurar el motor de base de datos: {str(e)}")
    raise e

class Base(DeclarativeBase):
    """
    Clase base declarativa estándar para todos los modelos de SQLAlchemy 2.0.
    """
    pass

def init_db() -> None:
    """
    Inicializa la base de datos creando las tablas e insertando roles y usuarios por defecto si no existen.
    """
    try:
        # Importamos los modelos aquí para registrarlos con la metadata de Base antes de crear las tablas.
        # Al añadir nuevos modelos al proyecto, importarlos aquí para que SQLAlchemy cree sus tablas.
        from app.models.user import User, Role
        from app.models.vialidad import Vialidad
        Base.metadata.create_all(bind=engine)
        logger.info("Base de datos inicializada correctamente.")
        
        # Ejecutamos la siembra automática de Roles (Super Admin, Admin) y sus respectivos usuarios por defecto
        db = SessionLocal()
        try:
            from app.services.auth import AuthService
            AuthService.seed_roles_and_users(db)
            logger.info("Roles (Super Admin, Admin) y usuarios iniciales sembrados con éxito.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error al inicializar e insertar los datos base en la base de datos: {str(e)}")
