import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Button, Modal } from '../Common';
import { toast } from 'react-hot-toast';
import { vialidadService } from '../../api/vialidadService';
import { distritoService } from '../../api/distritoService';
import { conceptoService } from '../../api/conceptoService';
import { getVialidadPrintTemplate } from '../../utils/VialidadPrintTemplate';

/**
 * Modal de Carga Masiva de Vialidades desde Excel.
 * Parsea en cliente, permite editar concepto/distrito con selects, envía al backend y descarga ZIP de PDFs.
 */
const REQUIRED_COLS = ['solicitante', 'concepto'];
const ALL_COLS = ['solicitante', 'concepto', 'distrito'];

const normalizeRow = (row) => ({
  nombre: String(row['solicitante'] || row['SOLICITANTE'] || row['nombre'] || row['NOMBRE'] || '').trim(),
  concepto: String(row['concepto'] || row['CONCEPTO'] || '').trim(),
  distrito: String(row['distrito'] || row['DISTRITO'] || '').trim() || '',
  max_visualizaciones: 5, // Siempre 5 en carga masiva
  con_marca_agua: true,
});

const validateRow = (row, conceptosValidos) => {
  const errors = [];
  if (!row.nombre || row.nombre.length < 5) errors.push('Contribuyente debe tener al menos 5 caracteres');
  if (!row.concepto) errors.push('Concepto es requerido');
  else if (conceptosValidos.length > 0 && !conceptosValidos.includes(row.concepto.toUpperCase())) {
    errors.push('Concepto no válido');
  }
  return errors;
};

export const BulkImportModal = ({ isOpen, onClose, onSuccess, configPrecio, configAlcaldeFirma, configSecretarioFirma, configUrlVerificador }) => {
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [distritos, setDistritos] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [generatedHtmls, setGeneratedHtmls] = useState([]);
  const [importedCodes, setImportedCodes] = useState([]);
  const [printConfirm, setPrintConfirm] = useState({ isOpen: false, codes: [], message: '' });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ── Cargar distritos y conceptos del backend ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const [distRes, concRes] = await Promise.all([
          distritoService.getDistritos(1, 100),
          conceptoService.getConceptos(1, 100),
        ]);
        setDistritos((distRes.items || []).map(d => d.nombre.toUpperCase()));
        setConceptos((concRes.items || []).map(c => c.nombre.toUpperCase()));
      } catch (err) {
        console.error('Error cargando listas para carga masiva:', err);
      }
    };
    load();
  }, [isOpen]);

  // ── Recalcular errores al cambiar conceptos ────────────────────────────────
  useEffect(() => {
    if (rows.length === 0) return;
    setRows(prev => prev.map(r => ({ ...r, _errors: validateRow(r, conceptos) })));
  }, [conceptos]);

  // ── Editar una celda de la tabla de previsualización ──────────────────────
  const updateRow = (idx, field, value) => {
    setRows(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      updated[idx]._errors = validateRow(updated[idx], conceptos);
      return updated;
    });
  };

  // ── Descargar plantilla Excel ───────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    // Siempre obtener las listas actualizadas del backend
    let listaConceptos = [];
    let listaDistritos = [];
    try {
      const [distRes, concRes] = await Promise.all([
        distritoService.getDistritos(1, 100),
        conceptoService.getConceptos(1, 100),
      ]);
      listaDistritos = (distRes.items || []).map(d => d.nombre.toUpperCase());
      listaConceptos = (concRes.items || []).map(c => c.nombre.toUpperCase());
      setDistritos(listaDistritos);
      setConceptos(listaConceptos);
    } catch (err) {
      console.error('Error cargando listas para plantilla:', err);
      // Si falla, continuar con listas vacías en lugar de bloquear la descarga
      listaConceptos = conceptos.length > 0 ? conceptos : ['EMPLEADO'];
      listaDistritos = distritos.length > 0 ? distritos : ['SAN SALVADOR CENTRO'];
    }

    // Hoja 1: Datos a llenar
    const wsData = XLSX.utils.aoa_to_sheet([
      ['solicitante', 'concepto', 'distrito'],
      ['JUAN PÉREZ', listaConceptos[0] || 'EMPLEADO', listaDistritos[0] || 'SAN SALVADOR CENTRO'],
    ]);
    wsData['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 30 }];

    // Hoja 2: Listas de referencia
    const maxRows = Math.max(listaConceptos.length, listaDistritos.length);
    const refRows = [
      ['CONCEPTOS HABILITADOS', '', 'DISTRITOS / MUNICIPIOS HABILITADOS'],
      ['(Copia el valor exacto en la columna "concepto")', '', '(Copia el valor exacto en la columna "distrito")'],
    ];
    for (let i = 0; i < maxRows; i++) {
      refRows.push([listaConceptos[i] || '', '', listaDistritos[i] || '']);
    }
    const wsRef = XLSX.utils.aoa_to_sheet(refRows);
    wsRef['!cols'] = [{ wch: 35 }, { wch: 4 }, { wch: 35 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Vialidades');
    XLSX.utils.book_append_sheet(wb, wsRef, 'Listas de Referencia');
    XLSX.writeFile(wb, 'plantilla_vialidades.xlsx');
  };

  // ── Parsear archivo Excel ──────────────────────────────────────────────────
  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (raw.length === 0) { toast.error('El archivo no contiene datos.'); return; }
        if (raw.length > 500) { toast.error('El archivo supera el límite de 500 registros.'); return; }

        const parsed = raw.map((row, idx) => {
          const normalized = normalizeRow(row);
          const errors = validateRow(normalized, conceptos);
          return { ...normalized, _row: idx + 1, _errors: errors };
        });

        setRows(parsed);
        setStep(2);
      } catch (err) {
        console.error(err);
        toast.error('Error al leer el archivo Excel. Verifica el formato.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    parseFile(file);
  };

  // Eventos de arrastrar y soltar
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      toast.error('Formato no válido. Sube un archivo Excel (.xlsx o .xls)');
      return;
    }

    parseFile(file);
  };

  // ── Importar y generar ZIP de PDFs ─────────────────────────────────────────
  const handleImport = async () => {
    const validRows = rows.filter(r => r._errors.length === 0);
    if (validRows.length === 0) { toast.error('No hay registros válidos para importar.'); return; }

    setImporting(true);
    setProgress({ done: 0, total: validRows.length });
    const loadToast = toast.loading(`Registrando ${validRows.length} vialidades...`);

    try {
      const now = new Date();
      const currentYear = now.getFullYear();

      const payload = {
        items: validRows.map(r => ({
          nombre: r.nombre,
          concepto: r.concepto,
          distrito: r.distrito || null,
          max_visualizaciones: 5,
          con_marca_agua: true,
          fecha_emision: now.toISOString(),
          fecha_expiracion: `${currentYear}-12-31T23:59:59`,
        }))
      };

      const result = await vialidadService.createVialidadesBulk(payload);
      toast.success(`${result.total_creados} vialidades registradas correctamente.`, { id: loadToast });

      // ── Generar PDFs y empaquetar en ZIP ───────────────────────────────────
      const generatingToast = toast.loading('Generando boletas HTML... esto puede tardar unos segundos.');
      const apiVal = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const backendBaseUrl = apiVal.endsWith('/api') ? apiVal.substring(0, apiVal.length - 4) : apiVal;
      let templateHtml = '';

      try {
        const res = await fetch(`${backendBaseUrl}/static/templates/vialidad_template.html?t=${Date.now()}`);
        if (res.ok) templateHtml = await res.text();
      } catch (e) {
        console.error('Error cargando plantilla:', e);
      }

      const zip = new JSZip();
      const allHtmls = [];

      for (let i = 0; i < result.items.length; i++) {
        const v = result.items[i];
        setProgress({ done: i + 1, total: result.items.length });

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          configUrlVerificador + '/verificar/' + v.llave_unica
        )}`;

        const printData = {
          numeroRecibo: v.numero_recibo,
          distrito: v.distrito,
          solicitante: v.nombre,
          concepto: v.concepto,
          fecha: v.fecha_emision,
          fecha_expiracion: v.fecha_expiracion,
        };

        if (templateHtml) {
          const html = getVialidadPrintTemplate(
            templateHtml, printData, v.llave_unica, qrUrl,
            v.con_marca_agua, configPrecio, configAlcaldeFirma, configSecretarioFirma
          );
          allHtmls.push(html);
        }
      }
      setGeneratedHtmls(allHtmls);
      setImportedCodes(result.items.map(v => v.codigo_vialidad));

      toast.success('Boletas listas para impresión.', { id: generatingToast });
      setStep(3);
      onSuccess?.();

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Error al procesar la carga masiva.';
      toast.error(msg, { id: loadToast });
    } finally {
      setImporting(false);
    }
  };

  // ── Previsualizar e imprimir todas juntas ───────────────────────────────────
  const handlePrintAll = () => {
    if (generatedHtmls.length === 0) return;

    const firstHtml = generatedHtmls[0];
    const parser = new DOMParser();
    const combinedDoc = parser.parseFromString(firstHtml, 'text/html');
    const body = combinedDoc.body;
    body.innerHTML = ''; // Limpiar el contenido del primero

    // Agregar todas las boletas
    generatedHtmls.forEach(html => {
      const doc = parser.parseFromString(html, 'text/html');
      const container = doc.querySelector('.ticket-container');
      if (container) {
        body.appendChild(combinedDoc.importNode(container, true));
      }
    });

    // Añadir estilos para el salto de página e impresión
    const style = combinedDoc.createElement('style');
    style.textContent = `
      @page {
        size: letter !important;
        margin: 1cm !important;
      }
      body {
        padding: 0 !important;
        margin: 0 !important;
        background-color: white !important;
      }
      .ticket-container {
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border: 1px solid #bae6fd !important;
      }
      .ticket-container:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    `;
    combinedDoc.head.appendChild(style);

    // Crear un iframe invisible para mandar a imprimir directamente
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const combinedHtml = new XMLSerializer().serializeToString(combinedDoc);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(combinedHtml);
    doc.close();

    iframe.contentWindow.addEventListener('afterprint', () => {
      setPrintConfirm({
        isOpen: true,
        codes: importedCodes,
        message: '¿Se imprimieron todas las boletas del lote correctamente?'
      });
    });

    const loadToast = toast.loading('Abriendo diálogo de impresión de lote...');
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        toast.dismiss(loadToast);
      } catch (err) {
        console.error("Error al imprimir lote:", err);
        toast.error("Error al abrir diálogo de impresión.", { id: loadToast });
      } finally {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    }, 1500);
  };

  // ── Resetear modal ─────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(1);
    setRows([]);
    setGeneratedHtmls([]);
    setImportedCodes([]);
    setPrintConfirm({ isOpen: false, codes: [], message: '' });
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const validCount = rows.filter(r => r._errors.length === 0).length;
  const errorCount = rows.length - validCount;

  // Estilos reutilizables para los selects inline de la tabla
  const selectClass = "w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Carga Masiva de Vialidades"
      size="full"
      footer={
        <div className="flex justify-between items-center w-full gap-2">
          <Button variant="outline" onClick={handleClose} size="sm">Cerrar</Button>
          {step === 1 && (
            <Button variant="primary" onClick={handleDownloadTemplate} size="sm" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Descargar Plantilla Excel
            </Button>
          )}
          {step === 2 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setStep(1); setRows([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                Cambiar Archivo
              </Button>
              <Button
                variant="primary" size="sm"
                disabled={validCount === 0 || importing}
                onClick={handleImport}
                className="flex items-center gap-2"
              >
                {importing ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importando {progress.done}/{progress.total}...</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg> Importar {validCount} registros</>
                )}
              </Button>
            </div>
          )}
        </div>
      }
    >
      {/* ── Paso 1: Instrucciones y carga de archivo ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Instrucciones</h4>
            <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Descarga la plantilla Excel oficial usando el botón inferior.</li>
              <li>Llena los datos: <strong>solicitante</strong> y <strong>concepto</strong> son obligatorios.</li>
              <li>Sube el archivo — podrás corregir concepto y distrito desde listas desplegables antes de importar.</li>
              <li>Confirma la importación para registrar y descargar el ZIP de boletas listas para imprimir.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Columnas de la plantilla</p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_COLS.map(col => (
                <div key={col} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${REQUIRED_COLS.includes(col) ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{col}</span>
                  {REQUIRED_COLS.includes(col) && <span className="text-[10px] text-red-500 font-bold ml-auto">Req.</span>}
                </div>
              ))}
            </div>
          </div>

          <label className="block cursor-pointer">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all group ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.01]' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 mx-auto transition-colors mb-3 ${isDragging ? 'text-primary animate-bounce' : 'text-slate-300 dark:text-slate-600 group-hover:text-primary'}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isDragging ? '¡Suelta el archivo aquí!' : 'Haz clic o arrastra aquí tu archivo Excel'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Formatos aceptados: .xlsx, .xls — Máximo 500 registros</p>
            </div>
          </label>
        </div>
      )}

      {/* ── Paso 2: Previsualización con selects editables ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {validCount} válidos
            </span>
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500" /> {errorCount} con errores
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">{rows.length} filas — Puedes editar concepto y distrito directamente en la tabla.</span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-slate-500 font-bold uppercase tracking-wide w-10">#</th>
                  <th className="px-3 py-2.5 text-slate-500 font-bold uppercase tracking-wide">Contribuyente</th>
                  <th className="px-3 py-2.5 text-slate-500 font-bold uppercase tracking-wide w-40">Concepto *</th>
                  <th className="px-3 py-2.5 text-slate-500 font-bold uppercase tracking-wide w-44">Distrito</th>
                  <th className="px-3 py-2.5 text-slate-500 font-bold uppercase tracking-wide w-20">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row, idx) => (
                  <tr key={idx} className={row._errors.length > 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                    <td className="px-3 py-2 text-slate-400">{row._row}</td>

                    {/* Contribuyente — solo lectura */}
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                      {row.nombre || <span className="text-red-400 italic">vacío</span>}
                    </td>

                    {/* Concepto — select editable */}
                    <td className="px-2 py-1.5">
                      {conceptos.length > 0 ? (
                        <select
                          value={row.concepto}
                          onChange={e => updateRow(idx, 'concepto', e.target.value)}
                          className={selectClass}
                        >
                          <option value="">— Seleccionar —</option>
                          {conceptos.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">{row.concepto || <span className="text-red-400 italic">vacío</span>}</span>
                      )}
                    </td>

                    {/* Distrito — select editable */}
                    <td className="px-2 py-1.5">
                      {distritos.length > 0 ? (
                        <select
                          value={row.distrito || ''}
                          onChange={e => updateRow(idx, 'distrito', e.target.value)}
                          className={selectClass}
                        >
                          <option value="">— Ninguno —</option>
                          {distritos.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-500">{row.distrito || '—'}</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-3 py-2">
                      {row._errors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          OK
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold text-[10px]" title={row._errors.join(', ')}>
                          ✕ {row._errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Paso 3: Confirmación ── */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">¡Importación completada!</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Las vialidades han sido registradas correctamente en el sistema.
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-2 max-w-md animate-fade-in">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">¿Deseas imprimir todas las boletas?</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Hemos unificado todas las boletas de esta importación en un solo lote de impresión.
            </p>
            <Button variant="primary" onClick={handlePrintAll} className="flex items-center gap-2 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 01-2.24 2.24H8.58A2.25 2.25 0 016.34 18m11.32-4.171C19.09 13.692 20 12.43 20 11a4 4 0 00-4-4H8a4 4 0 00-4 4c0 1.43.91 2.692 2.22 2.829m12.36 0L17.66 18m-11.32 0L6.34 18M16 3H8M16 7H8" />
              </svg>
              Imprimir Todo el Lote
            </Button>
          </div>
        </div>
      )}
      <Modal
        isOpen={printConfirm.isOpen}
        onClose={() => setPrintConfirm({ isOpen: false, codes: [] })}
        title="Confirmar Impresión del Lote"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => setPrintConfirm({ isOpen: false, codes: [] })}
              size="sm"
            >
              No, cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={async () => {
                const currentCodes = printConfirm.codes;
                setPrintConfirm({ isOpen: false, codes: [] });
                if (currentCodes.length > 0) {
                  try {
                    await vialidadService.registrarImpresionLote(currentCodes);
                    onSuccess?.();
                    toast.success('Impresión del lote registrada correctamente.');
                  } catch (e) {
                    console.error(e);
                    toast.error('Error al registrar la impresión del lote.');
                  }
                }
              }}
              size="sm"
            >
              Sí, se imprimieron
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 01-2.24 2.24H8.58A2.25 2.25 0 016.34 18m11.32-4.171C19.09 13.692 20 12.43 20 11a4 4 0 00-4-4H8a4 4 0 00-4 4c0 1.43.91 2.692 2.22 2.829m12.36 0L17.66 18m-11.32 0L6.34 18M16 3H8M16 7H8" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center font-medium">
            {printConfirm.message}
          </p>
          <p className="text-xs text-slate-400 text-center">
            Esta acción sumará al contador de impresiones de las {printConfirm.codes.length} boletas de este lote.
          </p>
        </div>
      </Modal>
    </Modal>
  );
};

export default BulkImportModal;
