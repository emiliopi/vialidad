import React, { useState, useEffect } from 'react';

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
  const str = String(dateStr).trim();
  if (!str) return '';
  try {
    let dateObj;
    if (dateStr instanceof Date) {
      dateObj = dateStr;
    } else {
      const cleanDate = str.split('T')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          return `${day}.${month}.${year}`;
        }
        if (parts[2].length === 4) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${day}.${month}.${year}`;
        }
      }
      dateObj = new Date(str);
    }

    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}.${month}.${year}`;
    }
  } catch (e) {
    console.error(e);
  }
  return str;
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
  const currentYear = new Date().getFullYear();
  const apiVal = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const backendBaseUrl = apiVal.endsWith('/api') ? apiVal.substring(0, apiVal.length - 4) : apiVal;

  const [templateHtml, setTemplateHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${backendBaseUrl}/static/templates/vialidad_template.html?t=${new Date().getTime()}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("No se pudo cargar la plantilla");
        }
        return res.text();
      })
      .then(html => {
        if (active) {
          setTemplateHtml(html);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [backendBaseUrl]);

  if (loading) {
    return (
      <div className="w-[21cm] h-[22.4cm] flex items-center justify-center bg-white border border-sky-200 rounded-xl shadow-xl">
        <p className="text-sky-700 font-bold animate-pulse">Cargando...</p>
      </div>
    );
  }

  if (!templateHtml) return null;

  let targetUrl = `https://vialidad.gob.sv/verificar/${llave}`;
  try {
    if (qrUrl) {
      const parsed = new URL(qrUrl);
      targetUrl = parsed.searchParams.get('data') || targetUrl;
    }
  } catch (e) {
    console.error("Error parsing qrUrl", e);
  }

  const watermarkHtml = data.conMarcaAgua ? `
    <div class="watermark-container">
      <div class="watermark-inner">
        ${Array.from({ length: 150 }).map(() => `
          <span class="wt-text">FORMULARIO DE ESPECIES MUNICIPALES</span>
        `).join('')}
      </div>
    </div>
  ` : '';

  const fecha = (formatFechaPuntos(data.fecha) || '').trim() || '__.__.____';
  const fechaExp = (formatFechaPuntos(data.fecha_expiracion) || '').trim() || `31.12.${currentYear}`;
  const montoLetras = numeroALetras(Number(precio));

  const fAlcalde = firmaAlcaldeUrl ? `${backendBaseUrl}${firmaAlcaldeUrl}` : "/firma_alcalde.png";
  const fSecretario = firmaSecretarioUrl ? `${backendBaseUrl}${firmaSecretarioUrl}` : "/firma_secretario.png";

  let rendered = templateHtml
    .replace("{{watermark_html}}", watermarkHtml)
    .replace("{{distrito}}", data.distrito || '&nbsp;')
    .replace("{{numero_recibo}}", data.numeroRecibo || '&nbsp;')
    .replace("{{precio_vialidad}}", Number(precio).toFixed(2))
    .replace("{{solicitante}}", data.solicitante || '&nbsp;')
    .replace("{{monto_letras}}", montoLetras)
    .replace("{{concepto}}", data.concepto || '&nbsp;')
    .replace("{{fecha_emision}}", fecha)
    .replace("{{fecha_expiracion}}", fechaExp)
    .replace("{{firma_alcalde}}", fAlcalde)
    .replace("{{firma_secretario}}", fSecretario)
    .replace("{{llave_unica}}", llave || '&nbsp;')
    .replace("{{qr_code}}", qrUrl || '')
    .replace("{{verification_data}}", targetUrl)
    .replace("{{logo_card}}", "static/logo_card_frontal.png");

  // Inyectar <base href> para que el iframe resuelva /static/ correctamente desde el backend
  const renderedWithBase = rendered.replace('<head>', `<head><base href="${backendBaseUrl}/">`);

  return (
    <iframe
      srcDoc={renderedWithBase}
      title="Documento de Vialidad"
      id="print-area"
      scrolling="no"
      style={{
        width: '21cm',
        height: '25cm',
        border: 'none',
        borderRadius: '0.75rem',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        display: 'block',
      }}
    />
  );
};

export default VialidadDocument;
