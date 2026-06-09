from datetime import datetime, timezone
from sqlalchemy import Integer, Numeric, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class ConfiguracionVialidad(Base):
    """
    Modelo de base de datos que mapea la tabla CONFIGURACION_VIALIDAD de SQL Server.
    Almacena los ajustes del precio y firmas digitalizadas.
    """
    __tablename__ = "CONFIGURACION_VIALIDAD"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    precio_vialidad: Mapped[float] = mapped_column(Numeric(10, 2), default=3.43, nullable=False)
    firma_alcalde_url: Mapped[str] = mapped_column(String(255), nullable=True)
    firma_secretario_url: Mapped[str] = mapped_column(String(255), nullable=True)

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
        return f"<ConfiguracionVialidad id={self.id} precio_vialidad={self.precio_vialidad}>"

