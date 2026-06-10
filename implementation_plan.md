# Plan de Implementación - Generación de PDF de Vialidades en el Backend

Este plan detalla los cambios necesarios para implementar un servicio de generación de PDF dinámico en el backend utilizando `reportlab`. El PDF reproducirá el diseño oficial de la boleta de vialidades (incluyendo firmas, códigos QR dinámicos y marca de agua) y se retornará como un flujo binario para su descarga o impresión nativa.

## User Review Required

> [!IMPORTANT]
> - Utilizaremos la librería `reportlab` por ser puramente Python, rápida, liviana y sin dependencias del sistema operativo (ideal para Docker/Rocky Linux).
> - Se requiere instalar `reportlab` en el entorno virtual del backend.
> - El endpoint del PDF será público para facilitar la integración directa por parte del sistema externo mediante redirección simple.

## Proposed Changes

### Backend - Dependencias

#### [MODIFY] [requirements.txt](file:///c:/laragon/www/vialidad/backend/requirements.txt)
- Agregar la librería de generación de PDF:
  - `reportlab>=4.1.0`

### Backend - Servicios y Lógica de PDF

#### [NEW] [pdf_generator.py](file:///c:/laragon/www/vialidad/backend/app/services/pdf_generator.py)
- Crear una clase/función `generar_pdf_vialidad` que:
  - Configure el canvas a tamaño carta (Letter).
  - Dibuje los marcos del boleto-recibo.
  - Genere el código QR dinámico integrado vectorialmente con `reportlab.graphics.barcode.qr.QrCodeWidget`.
  - Cargue e incruste las imágenes de las firmas digitales (o las firmas por defecto si los campos están vacíos).
  - Genere e incruste la marca de agua densa (si `con_marca_agua` está activo).
  - Retorne los bytes del archivo PDF en memoria (`io.BytesIO`).

### Backend - Endpoints

#### [MODIFY] [vialidades.py](file:///c:/laragon/www/vialidad/backend/app/api/v1/endpoints/vialidades.py)
- Agregar un endpoint `GET /api/vialidades/{llave}/pdf` (público):
  - Recibe la `llave` del documento y opcionalmente el `numero_recibo` para validar que exista.
  - Genera el PDF utilizando el servicio `generar_pdf_vialidad`.
  - Retorna un `StreamingResponse` con tipo MIME `application/pdf` y cabeceras de disposición del archivo.

## Verification Plan

### Manual Verification
- Instalar la dependencia `reportlab`.
- Generar una vialidad por Postman.
- Invocar el endpoint `GET /api/vialidades/VIA-XXXXXX/pdf?numero_recibo=YYYYYY` desde el navegador.
- Confirmar que se descarga o renderiza en el navegador un PDF de alta calidad con el formato del boleto listo para imprimir.
