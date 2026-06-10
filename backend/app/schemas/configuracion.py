from pydantic import BaseModel, Field
from typing import Optional

class ConfiguracionBase(BaseModel):
    precio_vialidad: float = Field(3.43, description="Precio unitario de la vialidad")
    firma_alcalde_url: Optional[str] = Field(None, max_length=255, description="URL de la firma del Alcalde")
    firma_secretario_url: Optional[str] = Field(None, max_length=255, description="URL de la firma del Secretario")

    class Config:
        from_attributes = True

class ConfiguracionUpdate(BaseModel):
    precio_vialidad: float = Field(..., gt=0, description="Precio unitario de la vialidad")

from datetime import datetime

class ConfiguracionResponse(ConfiguracionBase):
    id: int
    url_verificador: Optional[str] = None
    codigo_usuario_creacion: Optional[int] = None
    fecha_creacion: Optional[datetime] = None
    codigo_usuario_modificacion: Optional[int] = None
    fecha_modificacion: Optional[datetime] = None


