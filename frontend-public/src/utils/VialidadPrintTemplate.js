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

const formatFechaPuntos = (dateStr) => {
  if (!dateStr) return '';
  try {
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${day}.${month}.${year}`;
    }
  } catch (e) {
    console.error(e);
  }
  return dateStr;
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
      <div class="watermark-inner">
        ${Array.from({ length: 150 }).map(() => `
          <span class="wt-text">FORMULARIO DE ESPECIES MUNICIPALES</span>
        `).join('')}
      </div>
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
            inset: 0;
            z-index: 0;
            pointer-events: none;
            user-select: none;
            overflow: hidden;
            opacity: 0.07;
            mix-blend-mode: multiply;
          }

          .watermark-inner {
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
          }

          .wt-text {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
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
            <div class="space-y-1.5 pt-1" style="margin-top: 15px;">
              <div class="text-[15px] font-bold text-sky-700 flex items-end gap-2 w-full">
                <span class="font-black shrink-0 leading-none">MUNICIPIO / DISTRITO</span>
                <div class="flex-1 border-b border-sky-300 text-slate-600 font-bold uppercase tracking-wide text-xs px-2 leading-none min-h-[16px] text-left">
                  ${data.distrito || '&nbsp;'}
                </div>
              </div>

              <div class="flex justify-between items-baseline">
                <div class="text-[15px] font-black tracking-wide text-sky-700 uppercase">
                  BOLETO-RECIBO
                </div>

                <div class="text-center">
                  <div class="text-[15px] font-black tracking-wide text-sky-700 uppercase">
                    <span class="normal-case">No.</span> <span class="text-[26px] font-normal text-red-500">${data.numeroRecibo || '&nbsp;'}</span>
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-[15px] font-black tracking-wide text-sky-700 uppercase">
                    VALOR <span class="font-extrabold text-sky-700">$${Number(precio).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          <div class="relative z-10 mt-1 mb-3 bg-transparent rounded-2xl border border-sky-200 text-sky-700 text-sm leading-relaxed text-justify overflow-hidden">
            <!-- Detalle del Contribuyente -->
            <div class="p-4 space-y-2.5 bg-transparent">
              <div class="flex items-end gap-2 w-full">
                <span class="font-bold text-sky-700 shrink-0 pb-0.5">Contribuyente:</span>
                <strong class="flex-1 text-base uppercase border-b border-sky-300 px-3 py-0.5 font-bold tracking-wide text-slate-600">
                  ${data.solicitante || '&nbsp;'}
                </strong>
              </div>
    
              <p class="text-sky-700 font-bold leading-relaxed">
                ha pagado en este Distrito la suma de <span class="text-sky-700 font-bold uppercase">${numeroALetras(Number(precio))}</span>, que le corresponde como contribuyente al Fondo de Vialidad en concepto de <strong class="inline-block min-w-[150px] text-base uppercase border-b border-sky-300 px-3 py-0.5 font-bold tracking-wide text-slate-600">${data.concepto || '&nbsp;'}</strong>. Durante el presente año.
              </p>
            </div>

            <!-- Fechas (Divididas con borde superior e intermedio) -->
            <div class="grid grid-cols-2 border-t border-sky-200 bg-transparent divide-x divide-sky-200">
              <!-- Fecha de Emisión -->
              <div class="p-3 text-center font-sans space-y-1">
                <span class="text-sm tracking-wider text-sky-700 font-bold">Fecha de Emisión</span>
                <p class="text-sm font-bold text-slate-600">
                  ${formatFechaPuntos(data.fecha) || '__.__.____'}
                </p>
              </div>
              <!-- Fecha de Expiración -->
              <div class="p-3 text-center font-sans space-y-1">
                <span class="text-sm tracking-wider text-sky-700 font-bold">Fecha de Expiración</span>
                <p class="text-sm font-bold text-slate-600">
                  ${formatFechaPuntos(data.fecha_expiracion) || `31.12.${currentYear}`}
                </p>
              </div>
            </div>
          </div>

          <!-- Firmas -->
          <div class="relative z-10 grid grid-cols-2 gap-6 mt-12 pb-4">
            <!-- Columna Izquierda: Alcalde -->
            <div class="relative flex flex-col items-center pt-8 text-center">
              <!-- Imagen de Firma Real -->
              <img 
                src="${firmaAlcaldeUrl ? `${backendBaseUrl}${firmaAlcaldeUrl}` : "/firma_alcalde.png"}" 
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
                src="${firmaSecretarioUrl ? `${backendBaseUrl}${firmaSecretarioUrl}` : "/firma_secretario.png"}" 
                alt="Firma Secretario" 
                class="absolute -top-10 w-48 h-20 object-contain opacity-90"
                onerror="this.style.display='none';" 
              />
              <div class="w-40 h-[1px] bg-sky-200 mb-1"></div>
              <p class="text-[10px] font-black text-sky-700 uppercase">Secretario</p>
            </div>
          </div>

          <!-- Sección de Verificación QR y Llave Única (NUEVO) -->
          <div class="relative z-10 flex items-center justify-between border-t border-sky-200/40 mt-4 pt-2">
            <!-- Izquierda: Textos informativos y el QR debajo -->
            <div class="flex flex-col items-start space-y-1">
              <p class="text-[9px] font-bold text-sky-700 uppercase tracking-wide">Documento Firmado Electrónicamente</p>
              <p class="text-[10px] font-mono font-bold text-sky-700 tracking-wider">Llave Única: <span class="text-sky-700 font-bold">${llave}</span></p>
              
              <div class="flex flex-col items-center pt-2">
                <img src="${qrUrl}" alt="Código QR de Verificación" class="w-32 h-32 border border-sky-200 p-1 bg-white rounded-lg shadow-sm" />
                <p class="text-[8px] font-mono font-bold text-sky-700 mt-1">https://vialidad.gob.sv/verificar/${llave}</p>
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
