from datetime import datetime, timezone
from sqlalchemy import Table, Column, BigInteger, ForeignKey, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

# Tabla asociativa para la relación Muchos a Muchos entre Roles y Menús
roles_menus = Table(
    "ROLES_MENUS",
    Base.metadata,
    Column("codigo_rol", BigInteger, ForeignKey("ROLES.codigo_rol", ondelete="CASCADE"), primary_key=True),
    Column("codigo_menu", BigInteger, ForeignKey("MENUS.codigo_menu", ondelete="CASCADE"), primary_key=True)
)

class Menu(Base):
    """
    Modelo de base de datos que mapea la tabla MENUS de SQL Server.
    """
    __tablename__ = "MENUS"

    codigo_menu: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    path: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(500), nullable=False)

    # Campos de Auditoría
    codigo_usuario_creacion: Mapped[int] = mapped_column(BigInteger, ForeignKey("USUARIOS.codigo_usuario"), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=True
    )
    codigo_usuario_modificacion: Mapped[int] = mapped_column(BigInteger, ForeignKey("USUARIOS.codigo_usuario"), nullable=True)
    fecha_modificacion: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=True
    )

    def __repr__(self) -> str:
        return f"<Menu codigo_menu={self.codigo_menu} label={self.label} path={self.path}>"

