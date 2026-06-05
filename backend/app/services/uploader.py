import os
import uuid
import shutil
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
import logging

logger = logging.getLogger("app.services.uploader")

# Configuraciones por defecto para la carga de archivos
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Megabytes

# Mapa: MIME tipo real (magic bytes) → extensión esperada
ALLOWED_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png":  [".png"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"],
}


def _detect_real_mime(file_bytes: bytes) -> str:
    """
    Detecta el tipo MIME real del archivo leyendo sus primeros bytes (magic bytes),
    independientemente del Content-Type que declare el cliente.
    Usa python-magic-bin si está disponible; si no, cae a una verificación manual básica.
    """
    try:
        import magic
        return magic.from_buffer(file_bytes, mime=True)
    except ImportError:
        # Fallback manual por si python-magic no está instalado
        signatures = {
            b"\xff\xd8\xff": "image/jpeg",
            b"\x89PNG\r\n\x1a\n": "image/png",
            b"RIFF": "image/webp",  # webp: RIFF....WEBP
            b"%PDF": "application/pdf",
        }
        for sig, mime in signatures.items():
            if file_bytes.startswith(sig):
                return mime
        return "application/octet-stream"


class FileUploaderService:
    @staticmethod
    def upload_single_file(
        file: UploadFile,
        upload_dir: str = "static/uploads",
        max_size: int = MAX_FILE_SIZE,
        allowed_types: Optional[List[str]] = None
    ) -> str:
        """
        Sube un archivo de forma segura con doble validación:
        1. Valida el Content-Type declarado por el cliente.
        2. Valida el tipo real del archivo mediante magic bytes (evita bypass de extensión).
        Guarda el archivo con nombre UUID para evitar path traversal y colisiones.

        **Retorna** la ruta relativa accesible desde el frontend.
        """
        types_to_check = set(allowed_types) if allowed_types is not None else set(ALLOWED_MIME_TYPES.keys())

        # 1. Validar Content-Type declarado (primer filtro)
        if file.content_type not in types_to_check:
            logger.warning(f"Tipo de archivo declarado no permitido: {file.content_type}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de archivo no permitido. Tipos válidos: JPEG, PNG, WEBP, PDF."
            )

        # 2. Leer el archivo en memoria para validación real
        try:
            file.file.seek(0, os.SEEK_END)
            file_size = file.file.tell()
            file.file.seek(0)

            if file_size > max_size:
                logger.warning(f"Archivo excede límite de tamaño: {file_size} bytes")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El archivo supera el límite máximo de {max_size // (1024 * 1024)}MB."
                )

            # Leer los primeros 2048 bytes para detección de magic bytes (sin cargar todo en RAM)
            header_bytes = file.file.read(2048)
            file.file.seek(0)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error al leer el archivo para validación: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo procesar el archivo en el servidor."
            )

        # 3. Validar tipo MIME real por magic bytes (segundo filtro, evita bypass)
        real_mime = _detect_real_mime(header_bytes)
        if real_mime not in types_to_check:
            logger.warning(
                f"Posible ataque: Content-Type declarado '{file.content_type}' "
                f"no coincide con el tipo real '{real_mime}' (magic bytes)."
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El contenido real del archivo no corresponde al tipo declarado."
            )

        # 4. Crear directorio de destino de forma segura
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        target_directory = os.path.join(base_dir, upload_dir)
        try:
            os.makedirs(target_directory, exist_ok=True)
        except Exception as e:
            logger.critical(f"Error al crear directorio de uploads '{target_directory}': {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al inicializar el almacenamiento."
            )

        # 5. Generar nombre de archivo seguro con UUID (evita path traversal y colisiones)
        original_extension = os.path.splitext(file.filename or "")[1].lower()
        allowed_exts = ALLOWED_MIME_TYPES.get(real_mime, [".bin"])
        if original_extension not in allowed_exts:
            original_extension = allowed_exts[0]  # Usar extensión correcta según tipo real

        unique_filename = f"{uuid.uuid4()}{original_extension}"
        file_path = os.path.join(target_directory, unique_filename)

        # 6. Escribir archivo a disco de forma segura
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            logger.error(f"Error escribiendo '{unique_filename}' a disco: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al guardar el archivo en el servidor."
            )
        finally:
            file.file.close()

        logger.info(f"Archivo subido: {unique_filename} | Tipo real: {real_mime} | Tamaño: {file_size} bytes")

        # Retornar solo la URL relativa (sin el nombre original del archivo)
        return f"/static/uploads/{unique_filename}"
