from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class VialidadBase(BaseModel):
    llave_unica: str = Field(..., max_length=50)
    numero_recibo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=255)
    distrito: Optional[str] = Field(None, max_length=255)
    concepto: str = Field(..., max_length=255)
    fecha_emision: str = Field(..., max_length=50)
    fecha_expiracion: str = Field(..., max_length=50)
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

    class Config:
        from_attributes = True

class VialidadVerifyResponse(BaseModel):
    exitoso: bool
    mensaje: str
    visualizaciones_restantes: int
    datos: Optional[VialidadBase] = None

    class Config:
        from_attributes = True
