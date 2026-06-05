from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario")
    password: str = Field(..., min_length=6, description="Contraseña del usuario")

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario")
    email: EmailStr = Field(..., description="Correo electrónico válido")
    password: str = Field(..., min_length=6, description="Contraseña con al menos 6 caracteres, una mayúscula y un número")
    # codigo_rol fue eliminado: el rol siempre lo asigna el servidor (Admin por defecto).
    # Para asignar roles privilegiados usa el endpoint POST /api/v1/users/ (requiere Super Admin).

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        """
        Valida que la contraseña cumpla con los estándares mínimos de seguridad:
        - Al menos 1 letra mayúscula
        - Al menos 1 número
        """
        if not re.search(r"[A-Z]", value):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula.")
        if not re.search(r"[0-9]", value):
            raise ValueError("La contraseña debe contener al menos un número.")
        return value

class UserResponse(BaseModel):
    id: str = Field(..., description="Código único del usuario (serializado como string para evitar overflow de BigInt)")
    username: str
    email: str
    role: str = Field(..., description="Nombre del rol del usuario")

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    # refresh_token fue movido a una cookie httpOnly (inaccesible por JS, protección XSS)
    token_type: str = "bearer"
    user: UserResponse

class TokenRefreshRequest(BaseModel):
    # Ya no es necesario: el refresh_token se lee automáticamente de la cookie httpOnly
    pass

class TokenRefreshResponse(BaseModel):
    access_token: str
    # refresh_token fue movido a una cookie httpOnly en la respuesta del servidor
    token_type: str = "bearer"
