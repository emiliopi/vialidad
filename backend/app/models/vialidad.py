from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Vialidad(Base):
    """
    Modelo de base de datos que mapea la tabla VIALIDADES de SQL Server.
    """
    __tablename__ = "VIALIDADES"

    codigo_vialidad: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    llave_unica: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    numero_recibo: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    distrito: Mapped[str] = mapped_column(String(255), nullable=True)
    concepto: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_emision: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_expiracion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    con_marca_agua: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_visualizaciones: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    visualizaciones_restantes: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    
    # Control de Impresión
    impreso: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    veces_impresa: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fecha_ultima_impresion: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    codigo_usuario_ultima_impresion: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("USUARIOS.codigo_usuario"), nullable=True)
    codigo_lote: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

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

    # Instantáneas de Auditoría Histórica (Snapshots de firmas y precios en la emisión)
    precio_vialidad: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    firma_alcalde_url: Mapped[str] = mapped_column(String(255), nullable=True)
    firma_secretario_url: Mapped[str] = mapped_column(String(255), nullable=True)

    def __repr__(self) -> str:
        return f"<Vialidad codigo_vialidad={self.codigo_vialidad} llave_unica={self.llave_unica} numero_recibo={self.numero_recibo}>"
