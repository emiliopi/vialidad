/**
 * Genera la plantilla HTML para la impresión del Boleto-Recibo de Vialidad
 * optimizada para tamaño Carta (Letter).
 */
const numeroALetras = (numero) => {
  const unidades = ["CERO", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales = {
    11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
    16: "DIECISEIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
    21: "VEINTIUNO", 22: "VEINTIDOS", 23: "VEINTITRES", 24: "VEINTICUATRO", 25: "VEINTICINCO",
    26: "VEINTISEIS", 27: "VEINTISIETE", 28: "VEINTIOCHO", 29: "VEINTINUEVE"
  };

  const parteEntera = Math.floor(numero);
  const parteDecimal = Math.round((numero - parteEntera) * 100);

  let letrasEntera = "";
  if (parteEntera < 10) {
    letrasEntera = unidades[parteEntera];
  } else if (especiales[parteEntera]) {
    letrasEntera = especiales[parteEntera];
  } else {
    const u = parteEntera % 10;
    const d = Math.floor(parteEntera / 10);
    letrasEntera = decenas[d - 1] + (u > 0 ? ` Y ${unidades[u]}` : "");
  }

  let letrasDecimal = "";
  if (parteDecimal === 0) {
    letrasDecimal = "CERO";
  } else if (parteDecimal < 10) {
    letrasDecimal = unidades[parteDecimal];
  } else if (especiales[parteDecimal]) {
    letrasDecimal = especiales[parteDecimal];
  } else {
    const u = parteDecimal % 10;
    const d = Math.floor(parteDecimal / 10);
    letrasDecimal = decenas[d - 1] + (u > 0 ? ` Y ${unidades[u]}` : "");
  }

  return `${letrasEntera} DOLARES CON ${letrasDecimal} CENTAVOS`;
};

const formatFechaEspanol = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('de')) return dateStr;
  try {
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      return `${day} de ${meses[monthIndex]} de ${year}`;
    }
  } catch (e) {
    console.error(e);
  }
  return dateStr;
};

export const getVialidadPrintTemplate = (data, llave, qrUrl, conMarcaAgua = true, precio = 3.43, firmaAlcaldeUrl = '', firmaSecretarioUrl = '') => {
  const currentYear = new Date().getFullYear();
  const apiVal = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const backendBaseUrl = apiVal.endsWith('/api') ? apiVal.substring(0, apiVal.length - 4) : apiVal;

  const watermarkHtml = conMarcaAgua ? `
    <div class="watermark-container">
      ${Array.from({ length: 48 }).map(() => `
        <div class="watermark-content">
          <img src="/logo.png" class="watermark-logo" alt="" />
          <div class="watermark-line"></div>
          <div class="watermark-text-group">
            <span class="wt-min">MINISTERIO</span>
            <span class="wt-hac">DE HACIENDA</span>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Impresión de Vialidad</title>
        <!-- Tailwind CSS CDN para los estilos -->
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  sky: {
                    850: '#0369a1',
                    950: '#082f49',
                  }
                }
              }
            }
          }
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            background-color: white;
            color: #082f49;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: letter;
            margin: 1cm; /* Reducido de 1.5cm para maximizar área imprimible */
          }

          /* Asegurar que la boleta ocupe el espacio de forma limpia en la hoja */
          .ticket-container {
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
          }

          /* Marca de agua optimizada para impresión (Densa) */
          .watermark-container {
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
          }

          .watermark-content {
            opacity: 0.15; /* Visible para impresión */
            display: flex;
            align-items: center;
            gap: 0.4rem;
            justify-content: center;
            mix-blend-mode: multiply;
          }

          .watermark-logo {
            width: 2.2rem;
            height: 2.2rem;
            object-fit: contain;
          }

          .watermark-line {
            height: 1.8rem;
            border-left: 1.5px solid #082f49;
          }

          .watermark-text-group {
            display: flex;
            flex-direction: column;
            line-height: 0.9;
            text-align: left;
          }

          .wt-min {
            font-size: 0.45rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            color: #082f49;
            white-space: nowrap;
          }

          .wt-hac {
            font-size: 0.55rem;
            font-weight: 950;
            letter-spacing: 0.03em;
            color: #082f49;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <!-- Marca de agua de impresión densa y repetitiva (Logo + Línea vertical + Ministerio de Hacienda) -->
          ${watermarkHtml}

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
                <img src="/logo.png" alt="Escudo El Salvador" class="w-9 h-9 object-contain" />
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
                  ${data.distrito || '&nbsp;'}
                </div>
              </div>

              <div class="flex justify-between items-center">
                <div class="text-[13px] font-bold tracking-wide text-sky-700 uppercase">
                  BOLETO-RECIBO</br> SERIE "C"
                </div>

                <div class="text-center">
                  <div class="text-[13px] font-bold tracking-wide text-sky-700 uppercase">
                    Nº <span class="text-[23px] text-red-500 text-base">${data.numeroRecibo || '&nbsp;'}</span>
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-[13px] font-bold tracking-wide text-sky-700 uppercase">
                    VALOR <span class="font-extrabold text-sky-700">$${Number(precio).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          <div class="relative z-10 my-3 bg-white/50 p-4 rounded-2xl text-sky-800 text-sm leading-relaxed text-justify space-y-2.5">
            <div class="flex items-end gap-2 w-full">
              <span class="font-bold text-sky-800 shrink-0 pb-0.5">Contribuyente:</span>
              <strong class="flex-1 text-base uppercase border-b border-sky-300 px-3 py-0.5 font-bold tracking-wide text-slate-600">
                ${data.solicitante || '&nbsp;'}
              </strong>
            </div>
 
            <p class="text-sky-800 font-medium leading-relaxed">
              ha pagado en este Distrito la suma de <strong class="text-sky-800 font-bold uppercase">${numeroALetras(Number(precio))}</strong>, que le corresponde como contribuyente al Fondo de Vialidad en concepto de <strong class="inline-block min-w-[150px] text-base uppercase border-b border-sky-300 px-3 py-0.5 font-bold tracking-wide text-slate-600">${data.concepto || '&nbsp;'}</strong>. Durante el presente año.
            </p>
          </div>
 
          <!-- Firmas y Fechas -->
          <div class="relative z-10 grid grid-cols-2 gap-6 border-t border-sky-200/30 pt-2 mt-auto">
            <div class="flex flex-col items-center justify-between text-center space-y-8">
              <div class="text-center space-y-0.5">
                <span class="text-[10px] uppercase tracking-wider text-sky-600 font-bold">Fecha de Emisión</span>
                <p class="text-sm font-black text-sky-900 underline decoration-sky-300 decoration-2">
                  ${formatFechaEspanol(data.fecha) || '____________________'}
                </p>
              </div>
              
              <div class="relative flex flex-col items-center pt-4">
                <!-- Imagen de Firma Real -->
                <img 
                  src="${firmaAlcaldeUrl ? `${backendBaseUrl}${firmaAlcaldeUrl}` : "/firma_alcalde.png"}" 
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
                  ${formatFechaEspanol(data.fecha_expiracion) || `31 de diciembre de ${currentYear}`}
                </p>
              </div>
 
              <div class="relative flex flex-col items-center pt-4">
                <!-- Imagen de Firma Real -->
                <img 
                  src="${firmaSecretarioUrl ? `${backendBaseUrl}${firmaSecretarioUrl}` : "/firma_secretario.png"}" 
                  alt="Firma Secretario" 
                  class="absolute -top-12 w-48 h-24 object-contain opacity-90"
                  onerror="this.style.display='none';" 
                />
                <div class="w-40 h-[1.5px] bg-sky-800/60 mb-1"></div>
                <p class="text-[10px] font-black text-sky-900 uppercase">Secretario</p>
              </div>
            </div>
          </div>

          <!-- Sección de Verificación QR y Llave Única (NUEVO) -->
          <div class="relative z-10 flex items-center justify-between border-t border-sky-200/40 mt-4 pt-2">
            <!-- Izquierda: Textos informativos y el QR debajo -->
            <div class="flex flex-col items-start space-y-1">
              <p class="text-[9px] font-bold text-sky-700 uppercase tracking-wide">Documento Firmado Electrónicamente</p>
              <p class="text-[10px] font-mono font-black text-sky-900 tracking-wider">Llave Única: ${llave}</p>
              
              <div class="flex flex-col items-center pt-2">
                <img src="${qrUrl}" alt="Código QR de Verificación" class="w-32 h-32 border border-sky-200 p-1 bg-white rounded-lg shadow-sm" />
                <p class="text-[8px] font-mono text-sky-700 mt-1">https://vialidad.gob.sv/verificar/${llave}</p>
              </div>
            </div>
            
            <!-- Derecha: Logo de Tarjeta (En grande) -->
            <div class="flex items-center">
              <img src="/logo_card_frontal.png" alt="Logo Card" class="w-56 h-32 object-contain" />
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
  `;
};
