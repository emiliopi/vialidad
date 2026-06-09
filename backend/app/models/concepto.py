from datetime import datetime, timezone
from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Concepto(Base):
    """
    Modelo de base de datos que mapea la tabla CONCEPTOS de SQL Server.
    """
    __tablename__ = "CONCEPTOS"

    codigo_concepto: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Campos de Auditoría
    codigo_usuario_creacion: Mapped[int] = mapped_column(BigInteger, ForeignKey("USUARIOS.codigo_usuario"), nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False
    )
    codigo_usuario_modificacion: Mapped[int] = mapped_column(BigInteger, ForeignKey("USUARIOS.codigo_usuario"), nullable=True)
    fecha_modificacion: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<Concepto codigo_concepto={self.codigo_concepto} nombre={self.nombre} activo={self.activo}>"
