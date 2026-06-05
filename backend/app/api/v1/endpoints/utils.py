from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.api import deps
from app.models.user import User
from app.services.uploader import FileUploaderService
import logging

logger = logging.getLogger("app.api.v1.endpoints.utils")
router = APIRouter()

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(..., description="Archivo a subir (Imágenes JPEG/PNG o PDFs. Máximo 5MB)"),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Endpoint seguro que permite la subida de un archivo al servidor.
    Requiere autenticación JWT activa.
    """
    try:
        file_url = FileUploaderService.upload_single_file(file=file)
        return {
            "message": "Archivo subido exitosamente",
            "url": file_url
            # filename omitido intencionalmente: no exponer nombres internos del servidor
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error crítico en el endpoint de subida: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error inesperado al subir el archivo."
        )
