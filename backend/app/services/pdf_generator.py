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
    logo_path = (STATIC_DIR / "logo.png").as_uri()
    logo_card_path = (STATIC_DIR / "logo_card_frontal.png").as_uri()
    
    # 2. Resolver firmas dinámicas
    firma_alcalde_url = resolver_ruta_archivo(vialidad.firma_alcalde_url)
    if not firma_alcalde_url:
        firma_alcalde_url = (STATIC_DIR / "firma_alcalde.png").as_uri()
        
    firma_secretario_url = resolver_ruta_archivo(vialidad.firma_secretario_url)
    if not firma_secretario_url:
        firma_secretario_url = (STATIC_DIR / "firma_secretario.png").as_uri()

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

    # 6. Cargar plantilla HTML unificada
    template_path = STATIC_DIR / "templates" / "vialidad_template.html"
    try:
        with open(template_path, "r", encoding="utf-8") as f_temp:
            html_content = f_temp.read()
    except Exception as e:
        raise RuntimeError(f"No se pudo leer la plantilla HTML única en {template_path}: {str(e)}")

    # Realizar reemplazos en la plantilla
    html_content = html_content.replace("{{watermark_html}}", watermark_html)
    html_content = html_content.replace("{{distrito}}", distrito)
    html_content = html_content.replace("{{numero_recibo}}", str(vialidad.numero_recibo))
    html_content = html_content.replace("{{precio_vialidad}}", f"{float(vialidad.precio_vialidad):.2f}")
    html_content = html_content.replace("{{solicitante}}", solicitante)
    html_content = html_content.replace("{{monto_letras}}", monto_letras)
    html_content = html_content.replace("{{concepto}}", concepto)
    html_content = html_content.replace("{{fecha_emision}}", fecha)
    html_content = html_content.replace("{{fecha_expiracion}}", fecha_exp)
    html_content = html_content.replace("{{firma_alcalde}}", firma_alcalde_base64)
    html_content = html_content.replace("{{firma_secretario}}", firma_secretario_base64)
    html_content = html_content.replace("{{llave_unica}}", str(vialidad.llave_unica))
    html_content = html_content.replace("{{qr_code}}", qr_base64)
    html_content = html_content.replace("{{verification_data}}", verification_data)
    html_content = html_content.replace("{{logo_card}}", logo_card_base64)

    # 7. Crear archivos temporales
    html_fd, html_temp_path = tempfile.mkstemp(suffix=".html")
    os.close(html_fd)
    
    pdf_fd, pdf_temp_path = tempfile.mkstemp(suffix=".pdf")
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
