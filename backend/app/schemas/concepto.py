from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ConceptoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=255, description="Nombre del concepto")
    activo: bool = Field(True, description="Estado de activación del concepto")

    class Config:
        from_attributes = True

class ConceptoCreate(ConceptoBase):
    pass

class ConceptoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=255)
    activo: Optional[bool] = None

class ConceptoResponse(ConceptoBase):
    codigo_concepto: int
    codigo_usuario_creacion: int
    fecha_creacion: datetime
    codigo_usuario_modificacion: Optional[int] = None
    fecha_modificacion: datetime

class ConceptoPaginationResponse(BaseModel):
    items: list[ConceptoResponse]
    total: int
