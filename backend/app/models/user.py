from datetime import datetime, timezone
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.menu import Menu, roles_menus

class Role(Base):
    """
    Modelo de base de datos que mapea la tabla ROLES de SQL Server.
    """
    __tablename__ = "ROLES"

    codigo_rol: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Relación de uno a muchos con usuarios
    usuarios: Mapped[list["User"]] = relationship("User", back_populates="rol", cascade="all, delete-orphan")

    # Relación de muchos a muchos con menús
    menus: Mapped[list["Menu"]] = relationship(
        "Menu",
        secondary=roles_menus,
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Role codigo_rol={self.codigo_rol} nombre={self.nombre}>"


class User(Base):
    """
    Modelo de base de datos que mapea la tabla USUARIOS de SQL Server.
    """
    __tablename__ = "USUARIOS"

    codigo_usuario: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    usuario: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    codigo_rol: Mapped[int] = mapped_column(BigInteger, ForeignKey("ROLES.codigo_rol"), nullable=False)
    
    intentos_login: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ultimo_intento_login: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    refresh_token: Mapped[str] = mapped_column(String(500), nullable=True)
    
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False
    )
    fecha_modificacion: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False
    )

    # Relación inversa de muchos a uno con roles
    rol: Mapped["Role"] = relationship("Role", back_populates="usuarios")

    def __repr__(self) -> str:
        return f"<User codigo_usuario={self.codigo_usuario} usuario={self.usuario}>"
