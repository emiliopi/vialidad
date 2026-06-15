import io
import os
import subprocess
import tempfile
import urllib.parse
from pathlib import Path
from datetime import datetime
from app.models.vialidad import Vialidad
from app.core.config import settings

# Rutas base
BACKEND_DIR = Path(__file__).resolve().parents[2]
BASE_DIR = Path(__file__).resolve().parents[3]
STATIC_DIR = BACKEND_DIR / "static"
PUBLIC_DIR = BASE_DIR / "frontend-public" / "public"

# Descargar Tailwind CSS local si no existe para evitar peticiones de red lentas en headless Edge
TAILWIND_CSS_PATH = STATIC_DIR / "tailwind.min.css"
if not TAILWIND_CSS_PATH.exists():
    try:
        import urllib.request
        url = "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        STATIC_DIR.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, TAILWIND_CSS_PATH)
    except Exception:
        pass

def numero_a_letras(numero: float) -> str:
    """
    Convierte un número a su representación en letras en dólares y centavos.
    """
    unidades = ["CERO", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
    decenas = ["DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
    especiales = {
        11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
        16: "DIECISEIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
        21: "VEINTIUNO", 22: "VEINTIDOS", 23: "VEINTITRES", 24: "VEINTICUATRO", 25: "VEINTICINCO",
        26: "VEINTISEIS", 27: "VEINTISIETE", 28: "VEINTIOCHO", 29: "VEINTINUEVE"
    }

    try:
        parte_entera = int(numero)
        parte_decimal = round((numero - parte_entera) * 100)

        # Letras parte entera
        letras_entera = ""
        if parte_entera < 10:
            letras_entera = unidades[parte_entera]
        elif parte_entera in especiales:
            letras_entera = especiales[parte_entera]
        else:
            u = parte_entera % 10
            d = parte_entera // 10
            letras_entera = decenas[d - 1] + (f" Y {unidades[u]}" if u > 0 else "")

        # Letras parte decimal
        letras_decimal = ""
        if parte_decimal == 0:
            letras_decimal = "CERO"
        elif parte_decimal < 10:
            letras_decimal = unidades[parte_decimal]
        elif parte_decimal in especiales:
            letras_decimal = especiales[parte_decimal]
        else:
            u = parte_decimal % 10
            d = parte_decimal // 10
            letras_decimal = decenas[d - 1] + (f" Y {unidades[u]}" if u > 0 else "")

        return f"{letras_entera} DOLARES CON {letras_decimal} CENTAVOS"
    except Exception:
        return f"{numero:.2f} DOLARES"

def formatear_fecha_puntos(d) -> str:
    """
    Convierte una fecha a formato DD.MM.YYYY.
    """
    if not d:
        return ""
    if isinstance(d, str):
        try:
            from dateutil.parser import parse
            d = parse(d)
        except Exception:
            return d
    try:
        return f"{d.day:02d}.{d.month:02d}.{d.year}"
    except Exception:
        return str(d)

def formatear_fecha_letras(d) -> str:
    """
    Convierte una fecha a formato en palabras en español (ej. "10 de junio de 2026").
    """
    if not d:
        return "____________________"
    if isinstance(d, str):
        if "de" in d:
            return d
        try:
            from dateutil.parser import parse
            d = parse(d)
        except Exception:
            return d
            
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    try:
        return f"{d.day} de {meses[d.month - 1]} de {d.year}"
    except Exception:
        return str(d)

def resolver_ruta_archivo(url_o_path: str) -> str:
    """
    Resuelve una URL relativa a una ruta de archivo local absoluta compatible con el navegador (URI file://).
    """
    if not url_o_path:
        return ""
    try:
        if url_o_path.startswith("/static/"):
            ruta = STATIC_DIR / url_o_path.replace("/static/", "", 1)
            if ruta.exists():
                return ruta.as_uri()
        ruta_static = STATIC_DIR / url_o_path.lstrip("/\\")
        if ruta_static.exists():
            return ruta_static.as_uri()
        ruta_directa = Path(url_o_path)
        if ruta_directa.exists():
            return ruta_directa.as_uri()
    except Exception:
        pass
    return ""

def obtener_base64_imagen(ruta_o_url: str) -> str:
    """
    Lee un archivo local o URL y lo devuelve como una cadena Data URI en Base64.
    """
    if not ruta_o_url:
        return ""
    import base64 as b64
    from urllib.parse import unquote
    from urllib.request import url2pathname
    
    # Si es una URL de internet (http/https)
    if ruta_o_url.startswith(("http://", "https://")):
        try:
            import urllib.request
            with urllib.request.urlopen(ruta_o_url, timeout=3) as response:
                content_type = response.headers.get("Content-Type", "image/png")
                return f"data:{content_type};base64,{b64.b64encode(response.read()).decode('utf-8')}"
        except Exception:
            return ruta_o_url  # Retornar URL original como fallback
            
    # Si es un URI file://
    path_str = ruta_o_url
    if path_str.startswith("file:///"):
        path_str = url2pathname(unquote(path_str.replace("file://", "")))
    elif path_str.startswith("file://"):
        path_str = url2pathname(unquote(path_str.replace("file:", "")))
        
    try:
        p = Path(path_str)
        if p.exists() and p.is_file():
            ext = p.suffix.lower().replace(".", "")
            mime = f"image/{ext}" if ext in ("png", "jpg", "jpeg", "gif") else "image/png"
            if ext == "svg":
                mime = "image/svg+xml"
            with open(p, "rb") as f:
                return f"data:{mime};base64,{b64.b64encode(f.read()).decode('utf-8')}"
    except Exception:
        pass
        
    return ruta_o_url

def obtener_ruta_navegador() -> str:
    """
    Busca dinámicamente un navegador compatible con headless (Chrome, Chromium, Edge)
    según el sistema operativo (Windows o Linux/Rocky).
    """
    import shutil
    import platform

    # Lista de nombres de ejecutables a buscar en el PATH del sistema
    ejecutables = [
        "microsoft-edge-stable",
        "microsoft-edge",
        "msedge",
        "google-chrome-stable",
        "google-chrome",
        "chromium-browser",
        "chromium",
        "chrome"
    ]
    
    # Intentar encontrar en el PATH
    for exe in ejecutables:
        path = shutil.which(exe)
        if path:
            return path
            
    # Rutas comunes si no están en el PATH
    sistema = platform.system().lower()
    if "windows" in sistema:
        rutas_comunes = [
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
        ]
    else:  # Linux (Rocky/RHEL/etc.) o macOS
        rutas_comunes = [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
            "/usr/bin/microsoft-edge",
            "/usr/bin/microsoft-edge-stable",
            "/usr/local/bin/google-chrome",
            "/usr/local/bin/chromium"
        ]
        
    for ruta in rutas_comunes:
        if os.path.exists(ruta):
            return ruta
            
    # Fallback predeterminado según el sistema
    if "windows" in sistema:
        return r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    else:
        return "/usr/bin/google-chrome"

def generar_pdf_vialidad(vialidad: Vialidad, url_verificador: str = None) -> io.BytesIO:
    """
    Genera la boleta de vialidad oficial renderizando la plantilla HTML literal de impresión
    de React utilizando un navegador Headless compatible con soporte completo de tiempo virtual.
    """
    # 1. Definir rutas absolutas para imágenes de logos
    logo_path = (PUBLIC_DIR / "logo.png").as_uri()
    logo_card_path = (PUBLIC_DIR / "logo_card_frontal.png").as_uri()
    
    # 2. Resolver firmas dinámicas
    firma_alcalde_url = resolver_ruta_archivo(vialidad.firma_alcalde_url)
    if not firma_alcalde_url:
        firma_alcalde_url = (PUBLIC_DIR / "firma_alcalde.png").as_uri()
        
    firma_secretario_url = resolver_ruta_archivo(vialidad.firma_secretario_url)
    if not firma_secretario_url:
        firma_secretario_url = (PUBLIC_DIR / "firma_secretario.png").as_uri()

    # 2.5 Resolver Tailwind CSS
    tailwind_css = TAILWIND_CSS_PATH.as_uri() if TAILWIND_CSS_PATH.exists() else "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"

    # 3. Generar URL de verificación para el QR
    base_validator_url = url_verificador or settings.VALIDATOR_URL
    verification_data = f"{base_validator_url}/verificar/{vialidad.llave_unica}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={urllib.parse.quote(verification_data)}"
    
    # 3.5 Convertir todas las imágenes a Base64 inline para que la página sea 100% autocontenida y cargue al instante
    logo_base64 = obtener_base64_imagen(logo_path)
    logo_card_base64 = obtener_base64_imagen(logo_card_path)
    firma_alcalde_base64 = obtener_base64_imagen(firma_alcalde_url)
    firma_secretario_base64 = obtener_base64_imagen(firma_secretario_url)
    qr_base64 = obtener_base64_imagen(qr_url)
    
    # 4. Preparar textos y variables
    distrito = vialidad.distrito or "&nbsp;"
    solicitante = vialidad.nombre or "&nbsp;"
    concepto = vialidad.concepto or "&nbsp;"
    current_year = datetime.now().year
    if getattr(vialidad, "fecha_creacion", None):
        current_year = vialidad.fecha_creacion.year

    fecha = formatear_fecha_puntos(vialidad.fecha_emision) or "__.__.____"
    fecha_exp = formatear_fecha_puntos(vialidad.fecha_expiracion) or f"31.12.{current_year}"
    monto_letras = numero_a_letras(vialidad.precio_vialidad)

    # 5. Generar cuadrícula de la marca de agua densa (tal como está en React)
    watermark_html = ""
    if vialidad.con_marca_agua:
        watermark_html = '<div class="watermark-container">'
        watermark_html += '<div class="watermark-inner">'
        for _ in range(150):
            watermark_html += '<span class="wt-text">FORMULARIO DE ESPECIES MUNICIPALES</span>'
        watermark_html += '</div></div>'

    # 6. Copia LITERAl del HTML y CSS de getVialidadPrintTemplate.js
    html_content = f"""<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Impresión de Vialidad</title>
    <!-- Tailwind CSS CDN para los estilos -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {{
        theme: {{
          extend: {{
            colors: {{
              sky: {{
                850: '#0369a1',
                950: '#082f49',
              }}
            }}
          }}
        }}
      }}
    </script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      
      body {{
        font-family: 'Inter', sans-serif;
        background-color: white;
        color: #082f49;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }}

      @page {{
        size: letter;
        margin: 1cm;
      }}

      /* Asegurar que la boleta ocupe el espacio de forma limpia en la hoja */
      .ticket-container {{
        width: 100%;
        max-width: 21cm;
        height: 22.4cm; /* Cambiado de min-height para forzar la distribucion flex space-between en print */
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin: 0 auto;
        border: 1px solid #bae6fd;
        border-radius: 0.75rem;
        padding: 1.5rem; /* Ajustado para un espaciado balanceado */
        background-color: white;
        position: relative;
        box-sizing: border-box;
        overflow: hidden; /* Evita desbordamientos y saltos a la página 2 */
      }}

      /* Marca de agua optimizada para impresión (Densa) */
      .watermark-container {{
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        user-select: none;
        overflow: hidden;
        opacity: 0.07;
        mix-blend-mode: multiply;
      }}

      .watermark-inner {{
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        align-content: flex-start;
        justify-content: center;
        padding: 0.5rem;
        box-sizing: border-box;
      }}

      .wt-text {{
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: #082f49;
        white-space: nowrap;
      }}
    </style>
  </head>
  <body>
    <div class="ticket-container">
      <!-- Marca de agua de impresión densa y repetitiva (Logo + Línea vertical + Ministerio de Hacienda) -->
      {watermark_html}

      <!-- Encabezado del Recibo -->
      <div class="relative z-10 pb-2 space-y-2">
        <div class="flex justify-between items-center">
          <div class="text-left">
            <h2 class="text-[14px] font-bold tracking-wider uppercase text-sky-700 leading-none">
              República de El Salvador
            </h2>
            <h1 class="text-[18px] font-black tracking-wide uppercase text-sky-700 font-display leading-none" style="margin-top: 5px;">
              Fondo de Vialidad
            </h1>
          </div>

          <div class="text-center leading-none">
            <p class="text-[13px] font-black tracking-wide text-sky-700 uppercase">FORMULARIO DE</p>
            <p class="text-[13px] font-black tracking-wide text-sky-700 uppercase mt-0.5">ESPECIES MUNICIPALES</p>
          </div>
        </div>

        <!-- Fila Inferior: Municipio/Distrito (Ancho completo) y debajo las 3 Columnas (Boleto-Recibo, No, Valor) -->
        <div class="space-y-1.5 pt-1" style="margin-top: 25px;">
          <div class="text-[15px] font-bold text-sky-700 flex items-end gap-2 w-full">
            <span class="font-black shrink-0 leading-none">MUNICIPIO / DISTRITO</span>
            <div class="flex-1 border-b border-sky-300 text-slate-600 font-bold uppercase tracking-wide text-xs px-2 leading-none min-h-[16px] text-left">
              {distrito}
            </div>
          </div>

          <div class="flex justify-between items-baseline">
            <div class="text-[15px] font-black tracking-wide text-sky-700 uppercase">
              BOLETO-RECIBO
            </div>

            <div class="text-center">
              <div class="text-[15px] font-black tracking-wide text-sky-700 uppercase">
                <span class="normal-case">No.</span> <span class="text-[26px] font-normal text-red-500">{vialidad.numero_recibo}</span>
              </div>
            </div>

            <div class="text-right">
              <div class="text-[15px] font-black tracking-wide text-sky-700 uppercase">
                VALOR <span class="font-extrabold text-sky-700">${float(vialidad.precio_vialidad):.2f}</span>
              </div>
            </div>
        </div>
      </div>
      
      <div class="relative z-10 mt-1 mb-3 bg-transparent rounded-2xl border border-sky-200 text-sky-700 text-sm leading-relaxed text-justify overflow-hidden" style="margin-top: 1.8rem; margin-bottom: 2rem;">
        <!-- Detalle del Contribuyente -->
        <div class="p-4 space-y-2.5 bg-transparent" style="margin-bottom: 1px;">
          <div class="flex items-end gap-2 w-full">
            <span class="font-bold text-sky-700 shrink-0 pb-0.5">Contribuyente:</span>
            <strong class="flex-1 text-base uppercase border-b border-sky-300 px-3 py-0.5 font-bold tracking-wide text-slate-600">
              {solicitante}
            </strong>
          </div>

          <p class="text-sky-700 font-bold leading-relaxed">
            ha pagado en este Distrito la suma de <span class="text-sky-700 font-bold uppercase">{monto_letras}</span>, que le corresponde como contribuyente al Fondo de Vialidad en concepto de <strong class="inline-block min-w-[150px] text-base uppercase border-b border-sky-300 px-3 py-0.5 font-bold tracking-wide text-slate-600">{concepto}</strong>. Durante el presente año.
          </p>
        </div>

        <!-- Fechas (Divididas con borde superior e intermedio) -->
        <div class="grid grid-cols-2 border-t border-sky-200 bg-transparent divide-x divide-sky-200">
          <!-- Fecha de Emisión -->
          <div class="text-center font-sans" style="margin-top: 13px; margin-bottom: 12px;">
            <span class="text-sm tracking-wider text-sky-700 font-bold block">Fecha de Emisión</span>
            <p class="text-sm font-bold text-slate-600" style="margin-top: 5px;">
              {fecha}
            </p>
          </div>
          <!-- Fecha de Expiración -->
          <div class="text-center font-sans" style="margin-top: 13px; margin-bottom: 12px;">
            <span class="text-sm tracking-wider text-sky-700 font-bold block">Fecha de Expiración</span>
            <p class="text-sm font-bold text-slate-600" style="margin-top: 5px;">
              {fecha_exp}
            </p>
          </div>
        </div>
      </div>

      <!-- Firmas -->
      <div class="relative z-10 grid grid-cols-2 gap-6 mt-12 pb-4" style="margin-top: 4.8rem;">
        <!-- Columna Izquierda: Alcalde -->
        <div class="relative flex flex-col items-center pt-8 text-center">
          <!-- Imagen de Firma Real -->
          <img 
            src="{firma_alcalde_base64}" 
            alt="Firma Alcalde" 
            class="absolute -top-10 w-48 h-20 object-contain opacity-90"
            onerror="this.style.display='none';" 
          />
          <div class="w-40 h-[1px] bg-sky-200 mb-1"></div>
          <p class="text-[10px] font-black text-sky-700 uppercase">Alcalde o Delegado</p>
        </div>

        <!-- Columna Derecha: Secretario -->
        <div class="relative flex flex-col items-center pt-8 text-center">
          <!-- Imagen de Firma Real -->
          <img 
            src="{firma_secretario_base64}" 
            alt="Firma Secretario" 
            class="absolute -top-10 w-48 h-20 object-contain opacity-90"
            onerror="this.style.display='none';" 
          />  
          <div class="w-40 h-[1px] bg-sky-200 mb-1"></div>
          <p class="text-[10px] font-black text-sky-700 uppercase">Secretario</p>
        </div>
      </div>

      <!-- Sección de Verificación QR y Llave Única -->
      <div class="relative z-10 flex items-center justify-between border-t border-sky-200/40 mt-4 pt-2" style="margin-top: 2.5rem;">
        <!-- Izquierda: Textos informativos y el QR debajo -->
        <div class="flex flex-col items-start space-y-1">
          <p class="text-[9px] font-bold text-sky-700 uppercase tracking-wide">Documento Firmado Electrónicamente</p>
          <p class="text-[10px] font-mono font-bold text-sky-700 tracking-wider">Llave Única: {vialidad.llave_unica}</p>
          
          <div class="flex flex-col items-center pt-2">
            <img src="{qr_base64}" alt="Código QR de Verificación" class="w-32 h-32 border border-sky-200 p-1 bg-white rounded-lg shadow-sm" />
            <p class="text-[8px] font-mono font-bold text-sky-700 mt-1">{verification_data}</p>
          </div>
        </div>
        
        <!-- Derecha: Logo de Tarjeta (En grande) -->
        <div class="flex items-center">
          <img src="{logo_card_base64}" alt="Logo Card" class="w-56 h-32 object-contain" />
        </div>
      </div>

      <!-- Pie de página para empleados del estado -->
      <div class="relative z-10 text-center border-t border-sky-200/40 mt-2 pt-1.5">
        <p class="text-[9px] font-bold text-sky-700">
          Para empleados del Estado o Particulares, con sueldo de más de CIENTO CATORCE DÓLARES CON VEINTIOCHO CENTAVOS mensuales, en adelante.
        </p>
      </div>
    </div>
  </body>
</html>
"""

    # 7. Crear archivos temporales
    html_fd, html_temp_path = tempfile.mkstemp(suffix=".html", dir=str(STATIC_DIR))
    os.close(html_fd)
    
    pdf_fd, pdf_temp_path = tempfile.mkstemp(suffix=".pdf", dir=str(STATIC_DIR))
    os.close(pdf_fd)
    
    try:
        # Escribir HTML
        with open(html_temp_path, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        # Guardar copia de depuración para desarrollo/visualización rápida
        try:
            with open(BACKEND_DIR / "test_output.html", "w", encoding="utf-8") as f_debug:
                f_debug.write(html_content)
        except Exception:
            pass
            
        # 8. Ejecutar navegador headless dinámicamente con un virtual-time-budget mínimo
        # ya que todos los estilos y recursos ahora son locales y estáticos.
        navegador_path = obtener_ruta_navegador()
        cmd = [
            navegador_path,
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-web-security",
            "--allow-file-access-from-files",
            "--print-to-pdf-no-header",
            "--virtual-time-budget=1000",
            f"--print-to-pdf={pdf_temp_path}",
            html_temp_path
        ]
        
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        
        # 9. Leer bytes del PDF
        with open(pdf_temp_path, "rb") as f:
            pdf_bytes = f.read()
            
        return io.BytesIO(pdf_bytes)
        
    except Exception as e:
        raise RuntimeError(f"Error al renderizar el HTML a PDF usando headless browser: {str(e)}")
        
    finally:
        # 10. Limpiar archivos temporales
        try:
            if os.path.exists(html_temp_path):
                os.remove(html_temp_path)
            if os.path.exists(pdf_temp_path):
                os.remove(pdf_temp_path)
        except Exception:
            pass
