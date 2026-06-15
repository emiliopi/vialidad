import React from 'react';

export const numeroALetras = (numero) => {
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

export const VialidadDocument = ({ data, llave, qrUrl, precio = 3.43, firmaAlcaldeUrl = '', firmaSecretarioUrl = '' }) => {
  // Obtener el año de la fecha actual para la expiración
  const currentYear = new Date().getFullYear();
  const apiVal = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const backendBaseUrl = apiVal.endsWith('/api') ? apiVal.substring(0, apiVal.length - 4) : apiVal;

  return (
    <div
      id="print-area"
      className="bg-white dark:bg-slate-900 text-sky-950 dark:text-sky-100 p-8 sm:p-12 w-[21cm] min-h-[16cm] flex flex-col justify-between font-sans border border-sky-200 rounded-xl relative select-text shadow-xl print:shadow-none print:border-sky-600 print:bg-white overflow-hidden"
      style={{ contentVisibility: 'auto' }}
    >
      {/* Marca de agua en pantalla */}
      {data.conMarcaAgua && (
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden opacity-[0.07] mix-blend-multiply dark:mix-blend-normal">
          <div className="absolute inset-0 w-full h-full flex flex-wrap gap-x-4 gap-y-3 content-start justify-center p-2">
            {Array.from({ length: 150 }).map((_, i) => (
              <span
                key={i}
                className="text-[10px] font-bold tracking-wider text-sky-950 dark:text-sky-100 whitespace-nowrap"
              >
                FORMULARIO DE ESPECIES MUNICIPALES
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Encabezado del Recibo */}
      <div className="relative z-10 pb-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-0 text-left">
            <h2 className="text-[14px] font-bold tracking-wider uppercase text-sky-700 leading-none">
              República de El Salvador
            </h2>
            <h1 className="text-[18px] font-black tracking-wide uppercase text-sky-700 font-display leading-none mt-1">
              Fondo de Vialidad
            </h1>
          </div>

          <div className="text-center leading-none">
            <p className="text-[13px] font-black tracking-wide text-sky-700 uppercase">FORMULARIO DE</p>
            <p className="text-[13px] font-black tracking-wide text-sky-700 uppercase font-display mt-0.5">ESPECIES MUNICIPALES</p>
          </div>
        </div>

        {/* Fila Inferior: Municipio/Distrito (Ancho completo) y debajo las 3 Columnas (Boleto-Recibo, No, Valor) */}
        <div className="space-y-3 pt-2">
          <div className="text-[13px] font-bold text-sky-700 flex items-end gap-2 w-full">
            <span className="text-[15px] font-black shrink-0 leading-none">MUNICIPIO / DISTRITO</span>
            <div className="flex-1 border-b border-sky-300 text-slate-600 font-bold uppercase tracking-wide text-xs px-2 leading-none min-h-[16px] text-left">
              {data.distrito || '\u00A0'}
            </div>
          </div>

          <div className="flex justify-between items-baseline">
            <div className="text-[15px] font-black tracking-wide text-sky-700 uppercase">
              BOLETO-RECIBO
            </div>

            <div className="text-center">
              <div className="text-[15px] font-black tracking-wide text-sky-700 uppercase">
                <span className="normal-case">No.</span> <span className="text-[26px] font-normal text-red-500">{data.numeroRecibo || '\u00A0'}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[15px] font-black tracking-wide text-sky-700 uppercase">
                VALOR <span className="font-extrabold text-sky-700">${Number(precio).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-3 mb-6 bg-transparent rounded-2xl border border-sky-200 text-sky-700 text-sm sm:text-base leading-relaxed text-justify overflow-hidden">
        {/* Detalle del Contribuyente */}
        <div className="p-6 space-y-4 bg-transparent">
          <div className="flex items-end gap-2 w-full">
            <span className="font-bold text-sky-700 shrink-0 pb-0.5">Contribuyente: </span>
            <strong className="flex-1 text-base uppercase bg-transparent border-b border-sky-300 px-3 py-0.5 rounded font-sans font-bold tracking-wide text-slate-600">
              {data.solicitante || '\u00A0'}
            </strong>
          </div>

          <p className="text-sky-700 font-bold leading-loose">
            ha pagado en este Distrito la suma de <span className="text-sky-700 font-bold uppercase">{numeroALetras(Number(precio))}</span>, que le corresponde como contribuyente al Fondo de Vialidad en concepto de <strong className="inline-block min-w-[150px] text-base uppercase bg-transparent border-b border-sky-300 px-3 py-0.5 rounded font-sans font-bold tracking-wide text-center text-slate-600">{data.concepto || '\u00A0'}</strong>. Durante el presente año.
          </p>
        </div>

        {/* Fechas (Divididas con borde superior e intermedio) */}
        <div className="grid grid-cols-2 border-t border-sky-200 bg-transparent divide-x divide-sky-200">
          {/* Fecha de Emisión */}
          <div className="p-3 text-center font-sans space-y-1">
            <span className="text-sm tracking-wider text-sky-700 font-bold">Fecha de Emisión</span>
            <p className="text-sm font-bold text-slate-600">
              {formatFechaPuntos(data.fecha) || '__.__.____'}
            </p>
          </div>
          {/* Fecha de Expiración */}
          <div className="p-3 text-center font-sans space-y-1">
            <span className="text-sm tracking-wider text-sky-700 font-bold">Fecha de Expiración</span>
            <p className="text-sm font-bold text-slate-600">
              {formatFechaPuntos(data.fecha_expiracion) || `31.12.${currentYear}`}
            </p>
          </div>
        </div>
      </div>

      {/* Firmas */}
      <div className="relative z-10 grid grid-cols-2 gap-6 mt-12 pb-4">
        {/* Columna Izquierda: Alcalde */}
        <div className="relative flex flex-col items-center pt-8 text-center">
          {/* Imagen de Firma Real */}
          <img
            src={firmaAlcaldeUrl ? `${backendBaseUrl}${firmaAlcaldeUrl}` : "/firma_alcalde.png"}
            alt="Firma Alcalde"
            className="absolute -top-10 w-48 h-20 object-contain select-none pointer-events-none opacity-90"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="w-40 h-[1.5px] bg-sky-700/60 mb-1"></div>
          <p className="text-[10px] font-black text-sky-700 uppercase">Alcalde o Delegado</p>
        </div>

        {/* Columna Derecha: Secretario */}
        <div className="relative flex flex-col items-center pt-8 text-center">
          {/* Imagen de Firma Real */}
          <img
            src={firmaSecretarioUrl ? `${backendBaseUrl}${firmaSecretarioUrl}` : "/firma_secretario.png"}
            alt="Firma Secretario"
            className="absolute -top-10 w-48 h-20 object-contain select-none pointer-events-none opacity-90"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="w-40 h-[1.5px] bg-sky-700/60 mb-1"></div>
          <p className="text-[10px] font-black text-sky-700 uppercase">Secretario</p>
        </div>
      </div>

      {/* Sección de Verificación QR y Llave Única */}
      <div className="relative z-10 flex items-center justify-between border-t border-sky-200/40 mt-6 pt-4">
        {/* Izquierda: Textos informativos y el QR debajo */}
        <div className="flex flex-col items-start space-y-1">
          <p className="text-[9px] font-bold text-sky-700 uppercase tracking-wide">Documento Firmado Electrónicamente</p>
          <p className="text-[10px] font-mono font-bold text-sky-700 tracking-wider">Llave Única: <span className="text-sky-700 font-bold">{llave}</span></p>

          <div className="flex flex-col items-center pt-2">
            <img src={qrUrl} alt="Código QR de Verificación" className="w-32 h-32 border border-sky-200 p-1 bg-white rounded-lg shadow-sm" />
            <p className="text-[8px] font-mono font-bold text-sky-700 mt-1">https://vialidad.gob.sv/verificar/{llave}</p>
          </div>
        </div>

        {/* Derecha: Logo de Tarjeta (En grande) */}
        <div className="flex items-center">
          <img src="/logo_card_frontal.png" alt="Logo Card" className="w-56 h-32 object-contain" />
        </div>
      </div>

      {/* Pie de página para empleados del estado */}
      <div className="relative z-10 text-center border-t border-sky-200/40 mt-4 pt-2">
        <p className="text-[9.5px] font-bold text-sky-700">
          Para empleados del Estado o Particulares, con sueldo de más de CIENTO CATORCE DÓLARES CON VEINTIOCHO CENTAVOS mensuales, en adelante.
        </p>
      </div>
    </div>
  );

};

export default VialidadDocument;
