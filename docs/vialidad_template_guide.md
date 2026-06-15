# Guía de la Plantilla de Diseño de Vialidades

Este documento especifica cómo está construida la plantilla única de diseño para las boletas de vialidad (`vialidad_template.html`), cómo funciona su renderizado, cómo modificarla y todos los detalles técnicos relevantes.

---

## 1. Ubicación de la Plantilla

La plantilla física está guardada en la siguiente ruta del backend:
* [vialidad_template.html](vialidad/backend/static/templates/vialidad_template.html)

Esta plantilla es servida de forma estática por el backend y es consumida tanto por el frontend (para impresión individual y en lote) como por el backend (para la pre-generación de archivos PDF estáticos si se requiere).

---

## 2. Variables de Reemplazo

El motor de renderizado busca placeholders envueltos en llaves dobles (`{{variable}}`) y los reemplaza con los datos dinámicos correspondientes. Las variables soportadas son:

| Variable | Tipo / Formato | Descripción |
|---|---|---|
| `{{watermark_html}}` | HTML String | Marca de agua repetitiva de fondo. Si está activa, inyecta divs con el texto "FORMULARIO DE ESPECIES MUNICIPALES". |
| `{{distrito}}` | Texto (Mayúsculas) | Distrito o municipio emisor de la boleta. |
| `{{numero_recibo}}` | Número | Correlativo único secuencial de la boleta (ej: `000456`). |
| `{{precio_vialidad}}` | Decimal (2 decimales) | Monto monetario de la boleta (ej: `3.43`). |
| `{{solicitante}}` | Texto (Mayúsculas) | Nombre completo del contribuyente/sujeto. |
| `{{monto_letras}}` | Texto (Mayúsculas) | Monto de la boleta escrito en letras (ej: `TRES DOLARES CON CUARENTA Y TRES CENTAVOS`). |
| `{{concepto}}` | Texto (Mayúsculas) | Concepto por el cual se emite la boleta (ej: `EMPLEADO`). |
| `{{fecha_emision}}` | Fecha (`DD.MM.YYYY`) | Fecha en la que se registra la boleta. |
| `{{fecha_expiracion}}` | Fecha (`DD.MM.YYYY`) | Fecha límite de validez (normalmente `31.12.YYYY`). |
| `{{firma_alcalde}}` | URL / Base64 Image | Imagen de la firma digitalizada del Alcalde/Delegado. |
| `{{firma_secretario}}` | URL / Base64 Image | Imagen de la firma digitalizada del Secretario. |
| `{{llave_unica}}` | UUID / Hash String | Llave criptográfica única de validación. |
| `{{qr_code}}` | URL / Base64 Image | Código QR que redirige al verificador público. |
| `{{verification_data}}` | URL | Enlace web completo de verificación rápida del QR. |
| `{{logo_card}}` | URL / Base64 Image | Logotipo principal oficial impreso en la boleta. |

---

## 3. Estructura de Estilos y Diseño (CSS)

La boleta está optimizada para tamaño **Carta (Letter)** y cuenta con las siguientes propiedades CSS esenciales:

### Dimensiones de la Boleta
```css
.ticket-container {
  width: 100%;
  max-width: 21cm;
  height: 22.4cm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0 auto;
  border: 1px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background-color: white;
  position: relative;
  box-sizing: border-box;
  overflow: hidden; /* Evita que salte a una segunda página al imprimir */
}
```

### Reglas de Página e Impresión
* **Tamaño y márgenes físicos de impresión:** Se configuran mediante `@page` y el `padding` del `body`.
```css
body {
  font-family: 'Inter', sans-serif;
  background-color: white;
  color: #082f49;
  margin: 0;
  padding: 1cm; /* Margen de resguardo para la impresora */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

@page {
  size: letter;
  margin: 0;
}
```

### Marca de Agua Densa (`watermark-container`)
* Se dibuja de forma absoluta en el fondo (`z-index: 0`) con una opacidad muy baja (`opacity: 0.07`) y modo de fusión `multiply` para no comprometer la legibilidad de los textos.
* Utiliza flexbox para repetir múltiples textos pequeños en diagonal a lo largo del fondo.

### Firmas Autógrafas
* Posicionadas de manera absoluta encima de sus líneas de base (`absolute -top-10`), simulando un firmado real sobre el papel.
* Se añade una lógica de respaldo `onerror="this.style.display='none';"` en las etiquetas `<img>` para que si alguna firma no está configurada, no aparezca la caja vacía de imagen rota.

---

## 4. Dónde se renderiza y cómo modificar el comportamiento

### Frontend (Uso de la Plantilla)
El frontend obtiene la plantilla directamente desde el backend y realiza los reemplazos utilizando el utilitario `getVialidadPrintTemplate`:
* **Archivo utilitario de reemplazo:** [VialidadPrintTemplate.js](vialidad/frontend/src/utils/VialidadPrintTemplate.js)
* **Impresión individual:** [Vialidades.jsx](vialidad/frontend/src/pages/Vialidades.jsx) (Crea un iframe invisible para mandar a imprimir).
* **Carga Masiva (Lote):** [BulkImportModal.jsx](vialidad/frontend/src/components/Vialidades/BulkImportModal.jsx) (Une todos los HTMLs procesados agregando reglas de salto de página `page-break-after: always` e imprime de una sola vez a través de un iframe invisible).

### Backend (Uso de la Plantilla)
* **Generación de PDFs:** [pdf_generator.py](vialidad/backend/app/services/pdf_generator.py)
* Carga la plantilla del disco, convierte a base64 las firmas locales y logos para incrustarlos directamente, y realiza los mismos reemplazos antes de invocar a Microsoft Edge Headless para la exportación a PDF.

---

## 5. Instrucciones para Modificar el Diseño

Si necesitas hacer cambios estéticos en la boleta:
1. Abre el archivo [vialidad_template.html](vialidad/backend/static/templates/vialidad_template.html).
2. Si deseas cambiar clases Tailwind, hazlo directamente en las etiquetas HTML.
3. Si añades estilos CSS personalizados, colócalos dentro de la etiqueta `<style>` en el `<head>`.
4. Si agregas un nuevo valor dinámico, usa la convención `{{mi_nueva_variable}}` y asegúrate de actualizar su reemplazo en:
   - [VialidadPrintTemplate.js](vialidad/frontend/src/utils/VialidadPrintTemplate.js) (Frontend).
   - [pdf_generator.py](vialidad/backend/app/services/pdf_generator.py) (Backend).
