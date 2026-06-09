from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
import re

class RoleResponse(BaseModel):
    codigo_rol: int
    nombre: str

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    usuario: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario único")
    email: EmailStr = Field(..., description="Correo electrónico válido")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Contraseña segura")
    codigo_rol: int = Field(..., description="Código de rol asignado")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        """
        Valida que la contraseña contenga al menos una mayúscula y un número.
        """
        if not re.search(r"[A-Z]", value):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula.")
        if not re.search(r"[0-9]", value):
            raise ValueError("La contraseña debe contener al menos un número.")
        return value

class UserUpdate(BaseModel):
    usuario: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    codigo_rol: Optional[int] = None
    intentos_login: Optional[int] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not re.search(r"[A-Z]", value):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula.")
        if not re.search(r"[0-9]", value):
            raise ValueError("La contraseña debe contener al menos un número.")
        return value

class UserResponseDetail(UserBase):
    codigo_usuario: int
    codigo_rol: int
    intentos_login: int
    ultimo_intento_login: Optional[datetime] = None
    fecha_creacion: datetime
    fecha_modificacion: datetime
    codigo_usuario_creacion: Optional[int] = None
    codigo_usuario_modificacion: Optional[int] = None
    rol: RoleResponse

    class Config:
        from_attributes = True

class UserPaginationResponse(BaseModel):
    items: list[UserResponseDetail]
    total: int
