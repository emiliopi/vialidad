from pydantic import BaseModel, Field
from typing import Optional

class ConfiguracionBase(BaseModel):
    precio_vialidad: float = Field(3.43, description="Precio unitario de la vialidad")
    firma_alcalde_url: Optional[str] = Field(None, max_length=255, description="URL de la firma del Alcalde")
    firma_secretario_url: Optional[str] = Field(None, max_length=255, description="URL de la firma del Secretario")
    logo_card_url: Optional[str] = Field(None, max_length=255, description="URL del logo de la tarjeta")
    firma_alcalde_height: Optional[str] = Field(None, max_length=50, description="Alto de la firma del Alcalde")
    firma_alcalde_top: Optional[str] = Field(None, max_length=50, description="Posición top de la firma del Alcalde")
    firma_secretario_height: Optional[str] = Field(None, max_length=50, description="Alto de la firma del Secretario")
    firma_secretario_top: Optional[str] = Field(None, max_length=50, description="Posición top de la firma del Secretario")

    class Config:
        from_attributes = True

class ConfiguracionUpdate(BaseModel):
    precio_vialidad: float = Field(..., gt=0, description="Precio unitario de la vialidad")
    firma_alcalde_height: Optional[str] = Field(None, max_length=50)
    firma_alcalde_top: Optional[str] = Field(None, max_length=50)
    firma_secretario_height: Optional[str] = Field(None, max_length=50)
    firma_secretario_top: Optional[str] = Field(None, max_length=50)

from datetime import datetime

class ConfiguracionResponse(ConfiguracionBase):
    id: int
    url_verificador: Optional[str] = None
    codigo_usuario_creacion: Optional[int] = None
    fecha_creacion: Optional[datetime] = None
    codigo_usuario_modificacion: Optional[int] = None
    fecha_modificacion: Optional[datetime] = None


