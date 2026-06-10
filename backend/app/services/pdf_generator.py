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

def generar_pdf_vialidad(vialidad: Vialidad, url_verificador: str = None) -> io.BytesIO:
    """
    Genera la boleta de vialidad oficial renderizando la plantilla HTML literal de impresión
    de React utilizando Microsoft Edge Headless con soporte completo de tiempo virtual para scripts.
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

    # 3. Generar URL de verificación para el QR
    base_validator_url = url_verificador or settings.VALIDATOR_URL
    verification_data = f"{base_validator_url}/verificar/{vialidad.llave_unica}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={urllib.parse.quote(verification_data)}"
    
    # 4. Preparar textos y variables
    distrito = vialidad.distrito or "&nbsp;"
    solicitante = vialidad.nombre or "&nbsp;"
    concepto = vialidad.concepto or "&nbsp;"
    fecha = vialidad.fecha_emision or "____________________"
    monto_letras = numero_a_letras(vialidad.precio_vialidad)
    
    current_year = datetime.now().year
    if getattr(vialidad, "fecha_creacion", None):
        current_year = vialidad.fecha_creacion.year

    # 5. Generar cuadrícula de la marca de agua densa (tal como está en React)
    watermark_html = ""
    if vialidad.con_marca_agua:
        watermark_html = '<div class="watermark-container">'
        for _ in range(48):
            watermark_html += f"""
            <div class="watermark-content">
              <img src="{logo_path}" class="watermark-logo" alt="" />
              <div class="watermark-line"></div>
              <div class="watermark-text-group">
                <span class="wt-min">MINISTERIO</span>
                <span class="wt-hac">DE HACIENDA</span>
              </div>
            </div>
            """
        watermark_html += '</div>'

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
        padding: 1cm; /* Mantiene el margen visual del documento */
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }}

      @page {{
        size: letter;
        margin: 0; /* Elimina cabeceras y pies de pagina del navegador */
      }}

      /* Asegurar que la boleta ocupe el espacio de forma limpia en la hoja */
      .ticket-container {{
        width: 100%;
        max-width: 21cm;
        min-height: 22.4cm; /* Reducido levemente de 23cm para evitar desbordes por milímetros */
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
        inset: 0; /* Ajustado a los límites exactos de la boleta */
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        grid-template-rows: repeat(8, 1fr);
        gap: 1rem;
        z-index: 0;
        pointer-events: none;
        user-select: none;
        overflow: hidden;
        padding: 1rem;
        box-sizing: border-box;
        mix-blend-mode: multiply; /* Evita que el fondo transparente salga blanco en impresión */
      }}

      .watermark-content {{
        opacity: 0.15; /* Visible para impresión */
        display: flex;
        align-items: center;
        gap: 0.4rem;
        justify-content: center;
        mix-blend-mode: multiply;
      }}

      .watermark-logo {{
        width: 2.2rem;
        height: 2.2rem;
        object-fit: contain;
      }}

      .watermark-line {{
        height: 1.8rem;
        border-left: 1.5px solid #082f49;
      }}

      .watermark-text-group {{
        display: flex;
        flex-direction: column;
        line-height: 0.9;
        text-align: left;
      }}

      .wt-min {{
        font-size: 0.45rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: #082f49;
        white-space: nowrap;
      }}

      .wt-hac {{
        font-size: 0.55rem;
        font-weight: 950;
        letter-spacing: 0.03em;
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
      <div class="relative z-10 border-b border-sky-200/50 pb-2 space-y-2">
        <div class="flex justify-between items-center">
          <div class="space-y-0.5 text-left">
            <h2 class="text-[14px] font-bold tracking-wider uppercase text-sky-700">
              República de El Salvador
            </h2>
            <h1 class="text-[18px] font-black tracking-wide uppercase text-sky-700 font-display">
              Fondo de Vialidad
            </h1>
          </div>

          <div class="flex items-center gap-2">
            <img src="{logo_path}" alt="Escudo El Salvador" class="w-9 h-9 object-contain" />
            <div class="h-8 border-l border-sky-300/80 mx-1"></div>
            <div class="text-left leading-none">
              <p class="text-[13px] font-bold tracking-wide text-sky-700 uppercase">Ministerio</p>
              <p class="text-[13px] font-bold tracking-wide text-sky-700 uppercase">de Hacienda</p>
            </div>
          </div>
        </div>

        <!-- Fila Inferior: Municipio/Distrito (Ancho completo) y debajo las 3 Columnas (Boleto-Recibo, No, Valor) -->
        <div class="space-y-1.5 pt-1">
          <div class="text-[13px] font-bold text-sky-700 flex items-end gap-2 w-full">
            <span class="shrink-0 leading-none">MUNICIPIO / DISTRITO:</span>
            <div class="flex-1 border-b border-sky-300 text-slate-600 font-bold uppercase tracking-wide text-xs px-2 leading-none min-h-[16px] text-left">
              {distrito}
            </div>
          </div>

          <div class="flex justify-between items-center">
            <div class="text-[13px] font-bold tracking-wide text-sky-700 uppercase">
              BOLETO-RECIBO</br> SERIE "C"
            </div>

            <div class="text-center">
              <div class="text-[13px] font-bold tracking-wide text-sky-700 uppercase">
                Nº <span class="text-[23px] text-red-500 text-base">{vialidad.numero_recibo}</span>
              </div>
            </div>

            <div class="text-right">
              <div class="text-[13px] font-bold tracking-wide text-sky-700 uppercase">
                VALOR <span class="font-extrabold text-sky-700">${float(vialidad.precio_vialidad):.2f}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 my-3 bg-white/50 p-4 rounded-2xl text-sky-800 text-sm leading-relaxed text-justify space-y-2.5">
        <div class="flex items-end gap-2 w-full">
          <span class="font-bold text-sky-800 shrink-0 pb-0.5">Contribuyente:</span>
          <strong class="flex-1 text-base uppercase border-b border-sky-300 px-3 py-0.5 font-bold tracking-wide text-slate-600">
            {solicitante}
          </strong>
        </div>

        <p class="text-sky-800 font-medium leading-relaxed">
          ha pagado en este Distrito la suma de <strong class="text-sky-800 font-bold uppercase">{monto_letras}</strong>, que le corresponde como contribuyente al Fondo de Vialidad en concepto de <strong class="inline-block min-w-[150px] text-base uppercase border-b border-sky-300 px-3 py-0.5 font-bold tracking-wide text-slate-600">{concepto}</strong>. Durante el presente año.
        </p>
      </div>

      <!-- Firmas y Fechas -->
      <div class="relative z-10 grid grid-cols-2 gap-6 border-t border-sky-200/30 pt-2 mt-auto">
        <div class="flex flex-col items-center justify-between text-center space-y-8">
          <div class="text-center space-y-0.5">
            <span class="text-[10px] uppercase tracking-wider text-sky-600 font-bold">Fecha de Emisión</span>
            <p class="text-sm font-black text-sky-900 underline decoration-sky-300 decoration-2">
              {fecha}
            </p>
          </div>
          
          <div class="relative flex flex-col items-center pt-4">
            <!-- Imagen de Firma Real -->
            <img 
              src="{firma_alcalde_url}" 
              alt="Firma Alcalde" 
              class="absolute -top-12 w-48 h-24 object-contain opacity-90"
              onerror="this.style.display='none';" 
            />
            <div class="w-40 h-[1.5px] bg-sky-800/60 mb-1"></div>
            <p class="text-[10px] font-black text-sky-900 uppercase">Alcalde o Delegado</p>
          </div>
        </div>

        <div class="flex flex-col items-center justify-between text-center space-y-8">
          <div class="text-center space-y-0.5">
            <span class="text-[10px] uppercase tracking-wider text-sky-600 font-bold">Fecha de Expiración</span>
            <p class="text-sm font-black text-sky-900 underline decoration-sky-300 decoration-2">
              31 de diciembre de {current_year}
            </p>
          </div>

          <div class="relative flex flex-col items-center pt-4">
            <!-- Imagen de Firma Real -->
            <img 
              src="{firma_secretario_url}" 
              alt="Firma Secretario" 
              class="absolute -top-12 w-48 h-24 object-contain opacity-90"
              onerror="this.style.display='none';" 
            />
            <div class="w-40 h-[1.5px] bg-sky-800/60 mb-1"></div>
            <p class="text-[10px] font-black text-sky-900 uppercase">Secretario</p>
          </div>
        </div>
      </div>

      <!-- Sección de Verificación QR y Llave Única -->
      <div class="relative z-10 flex items-center justify-between border-t border-sky-200/40 mt-4 pt-2">
        <!-- Izquierda: Textos informativos y el QR debajo -->
        <div class="flex flex-col items-start space-y-1">
          <p class="text-[9px] font-bold text-sky-700 uppercase tracking-wide">Documento Firmado Electrónicamente</p>
          <p class="text-[10px] font-mono font-black text-sky-900 tracking-wider">Llave Única: {vialidad.llave_unica}</p>
          
          <div class="flex flex-col items-center pt-2">
            <img src="{qr_url}" alt="Código QR de Verificación" class="w-32 h-32 border border-sky-200 p-1 bg-white rounded-lg shadow-sm" />
            <p class="text-[8px] font-mono text-sky-700 mt-1">{verification_data}</p>
          </div>
        </div>
        
        <!-- Derecha: Logo de Tarjeta (En grande) -->
        <div class="flex items-center">
          <img src="{logo_card_path}" alt="Logo Card" class="w-56 h-32 object-contain" />
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
            
        # 8. Ejecutar Microsoft Edge de forma headless con un virtual-time-budget
        # para esperar a que cargue Tailwind CSS CDN y las Google Fonts.
        edge_path = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        cmd = [
            edge_path,
            "--headless",
            "--disable-gpu",
            "--print-to-pdf-no-header",
            "--virtual-time-budget=10000",
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
