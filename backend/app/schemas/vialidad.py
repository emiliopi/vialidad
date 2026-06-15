from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class VialidadBase(BaseModel):
    llave_unica: Optional[str] = Field(None, max_length=50)
    numero_recibo: Optional[str] = Field(None, max_length=50)
    nombre: str = Field(..., max_length=255)
    distrito: Optional[str] = Field(None, max_length=255)
    concepto: str = Field(..., max_length=255)
    fecha_emision: datetime
    fecha_expiracion: datetime
    con_marca_agua: bool = Field(True)
    max_visualizaciones: int = Field(5, ge=1)

    class Config:
        from_attributes = True

class VialidadCreate(VialidadBase):
    pass

class VialidadResponse(VialidadBase):
    codigo_vialidad: int
    visualizaciones_restantes: int
    codigo_usuario_creacion: int
    fecha_creacion: datetime
    codigo_usuario_modificacion: Optional[int]
    fecha_modificacion: datetime
    precio_vialidad: Optional[float] = None
    firma_alcalde_url: Optional[str] = None
    firma_secretario_url: Optional[str] = None

    class Config:
        from_attributes = True

class VialidadVerifyResponse(BaseModel):
    exitoso: bool
    mensaje: str
    visualizaciones_restantes: int
    datos: Optional[VialidadResponse] = None

    class Config:
        from_attributes = True

class VialidadPaginationResponse(BaseModel):
    items: list[VialidadResponse]
    total: int


class VialidadBulkItem(BaseModel):
    """Un ítem individual dentro de una carga masiva."""
    nombre: str = Field(..., max_length=255)
    concepto: str = Field(..., max_length=255)
    distrito: Optional[str] = Field(None, max_length=255)
    max_visualizaciones: int = Field(5, ge=1)
    con_marca_agua: bool = Field(True)
    fecha_emision: Optional[datetime] = None
    fecha_expiracion: Optional[datetime] = None


class VialidadBulkCreate(BaseModel):
    """Payload para la carga masiva de vialidades (máx. 500 ítems)."""
    items: List[VialidadBulkItem] = Field(..., max_length=500)


class VialidadBulkResponse(BaseModel):
    """Respuesta de la carga masiva con los registros creados."""
    total_creados: int
    items: List[VialidadResponse]
