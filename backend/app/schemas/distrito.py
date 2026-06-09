from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class DistritoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=255, description="Nombre del distrito")
    activo: bool = Field(True, description="Estado de activación del distrito")

    class Config:
        from_attributes = True

class DistritoCreate(DistritoBase):
    pass

class DistritoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=255)
    activo: Optional[bool] = None

class DistritoResponse(DistritoBase):
    codigo_distrito: int
    codigo_usuario_creacion: int
    fecha_creacion: datetime
    codigo_usuario_modificacion: Optional[int] = None
    fecha_modificacion: datetime

class DistritoPaginationResponse(BaseModel):
    items: list[DistritoResponse]
    total: int
