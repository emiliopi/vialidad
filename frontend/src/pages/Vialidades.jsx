import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Modal, Badge, Skeleton, Tooltip, Select } from '../components/Common';
import { VialidadForm } from '../components/Vialidades/VialidadForm';
import { VialidadDocument } from '../components/Vialidades/VialidadDocument';
import { getVialidadPrintTemplate } from '../utils/VialidadPrintTemplate';
import { vialidadService } from '../api/vialidadService';
import { configuracionService } from '../api/configuracionService';
import { distritoService } from '../api/distritoService';
import { conceptoService } from '../api/conceptoService';
import { BulkImportModal } from '../components/Vialidades/BulkImportModal';

export const formatFechaEspanol = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr !== 'string') {
    try {
      dateStr = dateStr.toISOString();
    } catch (e) {
      return '';
    }
  }
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

export const Vialidades = () => {
  // Estados para el Listado (Datatable)
  const [vialidades, setVialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterDistrito, setFilterDistrito] = useState('');
  const [filterConcepto, setFilterConcepto] = useState('');
  const [distritosList, setDistritosList] = useState([]);
  const [conceptosList, setConceptosList] = useState([]);
  const [total, setTotal] = useState(0);
  const [isCreating, setIsCreatingState] = useState(() => sessionStorage.getItem('vialidad_is_creating') === 'true');
  const setIsCreating = (val) => {
    setIsCreatingState(val);
    if (val) {
      sessionStorage.setItem('vialidad_is_creating', 'true');
    } else {
      sessionStorage.removeItem('vialidad_is_creating');
    }
  };

  // Estados de Configuración Global de Vialidad
  const [configPrecio, setConfigPrecio] = useState(3.43);
  const [configAlcaldeFirma, setConfigAlcaldeFirma] = useState('');
  const [configSecretarioFirma, setConfigSecretarioFirma] = useState('');
  const [configUrlVerificador, setConfigUrlVerificador] = useState(window.location.origin);

  // Estados para la Previsualización de un Registro Existente
  const [selectedVialidad, setSelectedVialidad] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Estado del Formulario para Nueva Vialidad
  const [data, setData] = useState({
    numeroRecibo: '',
    distrito: '',
    solicitante: '',
    concepto: 'EMPLEADO',
    conMarcaAgua: true,
    max_visualizaciones: 5,
    fecha: new Date().toISOString().split('T')[0],
    fecha_expiracion: `${new Date().getFullYear()}-12-31`
  });

  const [llave, setLlave] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [vialidadTemplate, setVialidadTemplate] = useState('');
  const [printConfirm, setPrintConfirm] = useState({
    isOpen: false,
    codigoVialidad: null,
    codigos: null,
    title: 'Confirmar Impresión',
    message: '¿Se imprimió la boleta de vialidad correctamente?'
  });

  // Función para obtener/cargar la plantilla HTML única
  const getTemplateContent = async () => {
    if (vialidadTemplate) return vialidadTemplate;
    try {
      const apiVal = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const backendBaseUrl = apiVal.endsWith('/api') ? apiVal.substring(0, apiVal.length - 4) : apiVal;
      const res = await fetch(`${backendBaseUrl}/static/templates/vialidad_template.html`);
      if (res.ok) {
        const html = await res.text();
        setVialidadTemplate(html);
        return html;
      }
    } catch (e) {
      console.error("Error al obtener la plantilla de impresión:", e);
    }
    return '';
  };

  // Función para resetear/inicializar el formulario con llave nueva y limpia
  const resetForm = () => {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    setLlave(`VIA-${YYYY}-${MM}${DD}${HH}${mm}${ss}`);
    setData({
      numeroRecibo: '',
      distrito: 'SAN SALVADOR CENTRO',
      solicitante: '',
      concepto: 'EMPLEADO',
      conMarcaAgua: true,
      max_visualizaciones: 5,
      fecha: new Date().toISOString().split('T')[0],
      fecha_expiracion: `${YYYY}-12-31`
    });
  };

  // Carga de vialidades desde el backend
  const fetchVialidades = async () => {
    setLoading(true);
    try {
      const resData = await vialidadService.getVialidades(page, limit, search, filterDistrito, filterConcepto);
      setVialidades(resData.items || []);
      setTotal(resData.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la lista de vialidades.');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para recargar lista al cambiar paginación o búsqueda
  useEffect(() => {
    if (!isCreating) {
      fetchVialidades();
    }
  }, [page, limit, search, filterDistrito, filterConcepto, isCreating]);

  const loadConfig = async () => {
    try {
      const config = await configuracionService.getConfiguracion();
      setConfigPrecio(config.precio_vialidad);
      setConfigAlcaldeFirma(config.firma_alcalde_url || '');
      setConfigSecretarioFirma(config.firma_secretario_url || '');
      if (config.url_verificador) {
        setConfigUrlVerificador(config.url_verificador);
      }
    } catch (err) {
      console.error('Error al obtener la configuración:', err);
    }
  };

  // Inicialización de la primera llave, carga de configuración y precarga de plantilla
  useEffect(() => {
    resetForm();
    loadConfig();
    getTemplateContent();

    const loadFiltersData = async () => {
      try {
        const distRes = await distritoService.getDistritos(1, 100);
        setDistritosList((distRes.items || []).filter(d => d.activo));

        const concRes = await conceptoService.getConceptos(1, 100);
        setConceptosList((concRes.items || []).filter(c => c.activo));
      } catch (err) {
        console.error("Error al cargar datos de filtros:", err);
      }
    };
    loadFiltersData();
  }, []);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    configUrlVerificador + '/verificar/' + llave
  )}`;

  // Imprimir desde un registro del datatable (Re-imprimir)
  const handlePrintExisting = async (vialidadObj) => {
    const qrUrlExisting = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      configUrlVerificador + '/verificar/' + vialidadObj.llave_unica
    )}`;

    const docData = {
      numeroRecibo: vialidadObj.numero_recibo,
      distrito: vialidadObj.distrito,
      solicitante: vialidadObj.nombre,
      concepto: vialidadObj.concepto,
      conMarcaAgua: vialidadObj.con_marca_agua,
      fecha: vialidadObj.fecha_emision,
      fecha_expiracion: vialidadObj.fecha_expiracion
    };

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const printPrecio = vialidadObj.precio_vialidad !== undefined && vialidadObj.precio_vialidad !== null ? vialidadObj.precio_vialidad : configPrecio;
    const printAlcalde = vialidadObj.firma_alcalde_url || configAlcaldeFirma;
    const printSecretario = vialidadObj.firma_secretario_url || configSecretarioFirma;

    const templateHtml = await getTemplateContent();
    const htmlContent = getVialidadPrintTemplate(templateHtml, docData, vialidadObj.llave_unica, qrUrlExisting, vialidadObj.con_marca_agua, printPrecio, printAlcalde, printSecretario);
    
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.contentWindow.addEventListener('afterprint', () => {
      setPrintConfirm({
        isOpen: true,
        codigoVialidad: vialidadObj.codigo_vialidad,
        title: 'Confirmar Reimpresión',
        message: '¿Se imprimió la boleta de vialidad correctamente?'
      });
    });

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Error al re-imprimir:", err);
      } finally {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    }, 1500);
  };

  // Reimprimir lote completo de carga masiva
  const handlePrintLote = async (codigoLote) => {
    const loadToast = toast.loading(`Obteniendo boletas del lote ${codigoLote}...`);
    try {
      const loteItems = await vialidadService.getVialidadesLote(codigoLote);
      if (!loteItems || loteItems.length === 0) {
        toast.error('El lote no contiene registros.', { id: loadToast });
        return;
      }

      toast.loading('Generando lote de boletas para impresión...', { id: loadToast });

      const templateHtml = await getTemplateContent();
      const firstHtml = getVialidadPrintTemplate(
        templateHtml,
        {
          numeroRecibo: loteItems[0].numero_recibo,
          distrito: loteItems[0].distrito,
          solicitante: loteItems[0].nombre,
          concepto: loteItems[0].concepto,
          fecha: loteItems[0].fecha_emision,
          fecha_expiracion: loteItems[0].fecha_expiracion
        },
        loteItems[0].llave_unica,
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          configUrlVerificador + '/verificar/' + loteItems[0].llave_unica
        )}`,
        loteItems[0].con_marca_agua,
        loteItems[0].precio_vialidad !== undefined && loteItems[0].precio_vialidad !== null ? loteItems[0].precio_vialidad : configPrecio,
        loteItems[0].firma_alcalde_url || configAlcaldeFirma,
        loteItems[0].firma_secretario_url || configSecretarioFirma
      );

      const parser = new DOMParser();
      const combinedDoc = parser.parseFromString(firstHtml, 'text/html');
      const body = combinedDoc.body;
      body.innerHTML = ''; // Limpiar el contenido del primero

      // Generar y agregar cada boleta
      loteItems.forEach((v) => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          configUrlVerificador + '/verificar/' + v.llave_unica
        )}`;

        const printData = {
          numeroRecibo: v.numero_recibo,
          distrito: v.distrito,
          solicitante: v.nombre,
          concepto: v.concepto,
          fecha: v.fecha_emision,
          fecha_expiracion: v.fecha_expiracion
        };

        const printPrecio = v.precio_vialidad !== undefined && v.precio_vialidad !== null ? v.precio_vialidad : configPrecio;
        const printAlcalde = v.firma_alcalde_url || configAlcaldeFirma;
        const printSecretario = v.firma_secretario_url || configSecretarioFirma;

        const html = getVialidadPrintTemplate(
          templateHtml,
          printData,
          v.llave_unica,
          qrUrl,
          v.con_marca_agua,
          printPrecio,
          printAlcalde,
          printSecretario
        );

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

      const codes = loteItems.map(item => item.codigo_vialidad);
      iframe.contentWindow.addEventListener('afterprint', () => {
        setPrintConfirm({
          isOpen: true,
          codigoVialidad: null,
          codigos: codes,
          title: 'Confirmar Impresión de Lote',
          message: `¿Se imprimieron las ${codes.length} boletas de este lote correctamente?`
        });
      });

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

    } catch (err) {
      console.error(err);
      toast.error('Error al recuperar boletas del lote.', { id: loadToast });
    }
  };

  // Crear y guardar un nuevo registro de vialidad
  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);

    const loadToast = toast.loading('Registrando documento en base de datos...');
    try {
      const payload = {
        llave_unica: llave,
        numero_recibo: data.numeroRecibo || "TEMP",
        nombre: data.solicitante,
        distrito: data.distrito || null,
        concepto: data.concepto,
        fecha_emision: data.fecha,
        fecha_expiracion: `${new Date().getFullYear()}-12-31`,
        con_marca_agua: data.conMarcaAgua ?? true,
        max_visualizaciones: data.max_visualizaciones !== undefined ? data.max_visualizaciones : 5
      };

      const savedVialidad = await vialidadService.createVialidad(payload);
      toast.success('¡Documento registrado y listo para imprimir!', { id: loadToast });

      // Crear un iframe invisible
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const templateHtml = await getTemplateContent();
      
      // Mapear campos retornados por el backend (con el número de recibo secuencial real)
      const printData = {
        numeroRecibo: savedVialidad.numero_recibo,
        distrito: savedVialidad.distrito,
        solicitante: savedVialidad.nombre,
        concepto: savedVialidad.concepto,
        fecha: savedVialidad.fecha_emision,
        fecha_expiracion: savedVialidad.fecha_expiracion
      };

      const htmlContent = getVialidadPrintTemplate(
        templateHtml, 
        printData, 
        llave, 
        qrUrl, 
        savedVialidad.con_marca_agua, 
        configPrecio, 
        configAlcaldeFirma, 
        configSecretarioFirma
      );
      
      // Escribir el HTML al documento del iframe
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      iframe.contentWindow.addEventListener('afterprint', () => {
        setPrintConfirm({
          isOpen: true,
          codigoVialidad: savedVialidad.codigo_vialidad,
          title: 'Confirmar Impresión',
          message: '¿Se imprimió la boleta de vialidad correctamente?'
        });
      });

      // Pequeño delay de 1.5 segundos para garantizar que carguen los estilos CDN y el logo
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.error("Error al imprimir:", err);
        } finally {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          setIsPrinting(false);
          setIsCreating(false); // Regresar al datatable
          resetForm(); // Preparar para una nueva emisión
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Error al registrar el documento.';
      toast.error(errMsg, { id: loadToast });
      setIsPrinting(false);
    }
  };

  const openPreviewModal = (vialidad) => {
    setSelectedVialidad(vialidad);
    setIsModalOpen(true);
  };

  const isInvalid = (data.solicitante?.trim().length || 0) < 5 || !data.concepto?.trim() || !String(data.max_visualizaciones || '').trim();
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Encabezado del Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Vialidades
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {isCreating 
                ? 'Ingresa los datos para confeccionar el documento en formato oficial de papel bond listo para imprimir.' 
                : 'Listado y consulta de vialidades emitidas con visualización en verificador QR.'}
            </p>
          </div>
          <div>
            {isCreating ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)} className="flex items-center gap-2 shadow-sm">
                  Regresar al Listado
                </Button>
                <Button variant="primary" onClick={handlePrint} disabled={isInvalid || isPrinting} className="flex items-center gap-2 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.82l2.9-2.9m0 0l2.9 2.9m-2.9-2.9v6c0 1.1.9 2 2 2h2m4-14a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4-8a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h10.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6.75A1.5 1.5 0 015.25 20.25V8.25a1.5 1.5 0 011.5-1.5z" />
                  </svg>
                  {isPrinting ? 'Preparando...' : 'Guardar e Imprimir'}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Carga Masiva
                </Button>
                <Button variant="primary" onClick={() => { resetForm(); setIsCreating(true); }} className="flex items-center gap-2 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Crear Vialidad
                </Button>
              </div>
            )}
          </div>
        </div>

        {isCreating ? (
          /* PANTALLA DE CREACIÓN (FORMULARIO + PREVIEW) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Panel de Entrada de Datos (Izquierda) */}
            <div className="lg:col-span-4 print:hidden">
              <VialidadForm data={data} onChange={setData} />
            </div>

            {/* Área de Previsualización (Derecha) */}
            <div className="lg:col-span-8 flex justify-center bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <VialidadDocument data={data} llave={llave} qrUrl={qrUrl} precio={configPrecio} firmaAlcaldeUrl={configAlcaldeFirma} firmaSecretarioUrl={configSecretarioFirma} />
            </div>
          </div>
        ) : (
          /* PANTALLA DE LISTADO (DATATABLE) */
          <div className="space-y-6">
            {/* Buscador Server-Side */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                  </svg>
                </div>
                 <input
                  type="text"
                  placeholder="Buscar por contribuyente, llave única, recibo o fecha (AAAA-MM-DD)..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1); // Reiniciar paginación al filtrar
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              {/* Filtro por Distrito */}
              <div className="w-full md:w-64">
                <Select
                  value={filterDistrito}
                  onChange={(e) => {
                    setFilterDistrito(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Todos los distritos"
                  searchable={true}
                  options={[
                    { value: '', label: 'Todos los distritos' },
                    ...distritosList.map((d) => ({ value: d.nombre, label: d.nombre }))
                  ]}
                />
              </div>

              {/* Filtro por Concepto */}
              <div className="w-full md:w-64">
                <Select
                  value={filterConcepto}
                  onChange={(e) => {
                    setFilterConcepto(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Todos los conceptos"
                  searchable={true}
                  options={[
                    { value: '', label: 'Todos los conceptos' },
                    ...conceptosList.map((c) => ({ value: c.nombre, label: c.nombre }))
                  ]}
                />
              </div>
            </div>

            {/* Listado y Tabla */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-6">
                  <Skeleton variant="table" count={5} />
                </div>
              ) : vialidades.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-sm font-semibold">No se encontraron boletas de vialidades</p>
                  <p className="text-xs text-slate-400 mt-1">Realiza una nueva emisión o ajusta los filtros de búsqueda.</p>
                </div>
              ) : (
                <>
                  {/* Vista de Tabla para Escritorio */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Nº Recibo</th>
                          <th className="px-6 py-4">Contribuyente / Distrito</th>
                          <th className="px-6 py-4">Concepto</th>
                          <th className="px-6 py-4">Llave / Visualizaciones</th>
                          <th className="px-6 py-4">Fecha Emisión</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {vialidades.map((v) => (
                          <tr key={v.codigo_vialidad} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                              {v.numero_recibo}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{v.nombre}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{v.distrito || '—'}</span>
                                {v.codigo_lote && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-primary dark:text-sky-400 font-bold mt-1" title="Creado en carga masiva">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    {v.codigo_lote}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs uppercase font-medium">
                              {v.concepto}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-mono text-[10px] text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded w-fit">
                                  {v.llave_unica}
                                </span>
                                <div className="flex items-center">
                                  <Badge variant={v.visualizaciones_restantes > 0 ? 'success' : 'danger'}>
                                    {v.visualizaciones_restantes} / {v.max_visualizaciones} rest.
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                              {formatFechaEspanol(v.fecha_emision)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col gap-1 items-end">
                                {v.codigo_lote && (
                                  <Tooltip content="Imprimir lote completo" position="left">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePrintLote(v.codigo_lote)}
                                      className="p-1 px-2 border-primary/45 hover:bg-primary/5 text-primary hover:!text-primary flex items-center gap-1 text-[10px] w-24 justify-start font-bold"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 01-2.24 2.24H8.58A2.25 2.25 0 016.34 18m11.32-4.171C19.09 13.692 20 12.43 20 11a4 4 0 00-4-4H8a4 4 0 00-4 4c0 1.43.91 2.692 2.22 2.829m12.36 0L17.66 18m-11.32 0L6.34 18M16 3H8M16 7H8" />
                                      </svg>
                                      Lote
                                    </Button>
                                  </Tooltip>
                                )}
                                <Tooltip content="Imprimir boleta individual" position="left">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePrintExisting(v)}
                                    className="p-1 px-2 border-emerald-500/30 hover:!bg-emerald-50 text-emerald-600 hover:!text-emerald-600 dark:border-emerald-500/20 dark:hover:!bg-emerald-950/20 dark:text-emerald-400 dark:hover:!text-emerald-400 flex items-center gap-1 text-[10px] w-24 justify-start font-bold"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 01-2.24 2.24H8.58A2.25 2.25 0 016.34 18m11.32-4.171C19.09 13.692 20 12.43 20 11a4 4 0 00-4-4H8a4 4 0 00-4 4c0 1.43.91 2.692 2.22 2.829m12.36 0L17.66 18m-11.32 0L6.34 18M16 3H8M16 7H8" />
                                    </svg>
                                    Individual
                                  </Button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de Tarjetas para Móviles */}
                  <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {vialidades.map((v) => (
                      <div key={v.codigo_vialidad} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Recibo</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{v.numero_recibo}</p>
                          </div>
                          <Badge variant={v.visualizaciones_restantes > 0 ? 'success' : 'danger'}>
                            {v.visualizaciones_restantes} / {v.max_visualizaciones} rest.
                          </Badge>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Contribuyente</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5 flex-wrap">
                            <span>{v.nombre}</span>
                            {v.codigo_lote && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold">
                                {v.codigo_lote}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Concepto</p>
                            <p className="text-slate-600 dark:text-slate-400 uppercase font-medium">{v.concepto}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Distrito</p>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">{v.distrito || '-'}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-mono text-[10px] text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-1 rounded">
                            {v.llave_unica}
                          </span>
                          <div className="flex gap-2">
                            {v.codigo_lote && (
                              <Tooltip content="Imprimir lote completo" position="top">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePrintLote(v.codigo_lote)}
                                  className="flex items-center gap-1 py-1 px-2 text-xs border-primary/45 text-primary hover:text-primary hover:bg-primary/5 font-bold"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 01-2.24 2.24H8.58A2.25 2.25 0 016.34 18m11.32-4.171C19.09 13.692 20 12.43 20 11a4 4 0 00-4-4H8a4 4 0 00-4 4c0 1.43.91 2.692 2.22 2.829m12.36 0L17.66 18m-11.32 0L6.34 18M16 3H8M16 7H8" />
                                  </svg>
                                  Lote
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip content="Imprimir boleta individual" position="top">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintExisting(v)}
                                className="flex items-center gap-1.5 py-1 px-2.5 text-xs border-emerald-500/30 hover:!bg-emerald-50 text-emerald-600 hover:!text-emerald-600 dark:border-emerald-500/20 dark:hover:!bg-emerald-950/20 dark:text-emerald-400 dark:hover:!text-emerald-400 font-bold"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 01-2.24 2.24H8.58A2.25 2.25 0 016.34 18m11.32-4.171C19.09 13.692 20 12.43 20 11a4 4 0 00-4-4H8a4 4 0 00-4 4c0 1.43.91 2.692 2.22 2.829m12.36 0L17.66 18m-11.32 0L6.34 18M16 3H8M16 7H8" />
                                </svg>
                                Individual
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Paginador */}
              {totalPages > 1 && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Mostrando página {page} de {totalPages} ({total} registros emitidos)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Vista de Documento y Re-Impresión */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Vista Previa de Vialidad"
          size="full"
          footer={
            <div className="flex justify-end gap-2.5 w-full">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} size="sm">
                Cerrar
              </Button>
              <Button variant="primary" onClick={() => handlePrintExisting(selectedVialidad)} size="sm" className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.82l2.9-2.9m0 0l2.9 2.9m-2.9-2.9v6c0 1.1.9 2 2 2h2m4-14a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4-8a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h10.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6.75A1.5 1.5 0 015.25 20.25V8.25a1.5 1.5 0 011.5-1.5z" />
                </svg>
                Imprimir Copia
              </Button>
            </div>
          }
        >
          {selectedVialidad && (
            <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-6 rounded-xl overflow-x-auto">
              <div className="scale-90 origin-top">
                <VialidadDocument
                  data={{
                    numeroRecibo: selectedVialidad.numero_recibo,
                    distrito: selectedVialidad.distrito,
                    solicitante: selectedVialidad.nombre,
                    concepto: selectedVialidad.concepto,
                    conMarcaAgua: selectedVialidad.con_marca_agua,
                    fecha: selectedVialidad.fecha_emision,
                    fecha_expiracion: selectedVialidad.fecha_expiracion
                  }}
                  llave={selectedVialidad.llave_unica}
                  qrUrl={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    configUrlVerificador + '/verificar/' + selectedVialidad.llave_unica
                  )}`}
                  precio={selectedVialidad.precio_vialidad !== undefined && selectedVialidad.precio_vialidad !== null ? selectedVialidad.precio_vialidad : configPrecio}
                  firmaAlcaldeUrl={selectedVialidad.firma_alcalde_url || configAlcaldeFirma}
                  firmaSecretarioUrl={selectedVialidad.firma_secretario_url || configSecretarioFirma}
                />
              </div>
            </div>
          )}
        </Modal>

      </div>

      {/* Modal de Carga Masiva */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => { fetchVialidades(); }}
        configPrecio={configPrecio}
        configAlcaldeFirma={configAlcaldeFirma}
        configSecretarioFirma={configSecretarioFirma}
        configUrlVerificador={configUrlVerificador}
      />

      {/* Modal de Confirmación de Impresión */}
      <Modal
        isOpen={printConfirm.isOpen}
        onClose={() => setPrintConfirm(prev => ({ ...prev, isOpen: false, codigoVialidad: null, codigos: null }))}
        title={printConfirm.title}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => setPrintConfirm(prev => ({ ...prev, isOpen: false, codigoVialidad: null, codigos: null }))}
              size="sm"
            >
              No, cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={async () => {
                const cod = printConfirm.codigoVialidad;
                const batch = printConfirm.codigos;
                setPrintConfirm(prev => ({ ...prev, isOpen: false, codigoVialidad: null, codigos: null }));
                if (cod) {
                  try {
                    await vialidadService.registrarImpresion(cod);
                    fetchVialidades();
                    toast.success('Impresión registrada correctamente.');
                  } catch (e) {
                    console.error(e);
                    toast.error('Error al registrar la impresión.');
                  }
                } else if (batch && batch.length > 0) {
                  try {
                    await vialidadService.registrarImpresionLote(batch);
                    fetchVialidades();
                    toast.success('Impresión de lote registrada correctamente.');
                  } catch (e) {
                    console.error(e);
                    toast.error('Error al registrar la impresión de lote.');
                  }
                }
              }}
              size="sm"
            >
              Sí, se imprimió
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
            {printConfirm.codigos && printConfirm.codigos.length > 0 
              ? `Esta acción sumará al contador de impresiones de las ${printConfirm.codigos.length} boletas de este lote.`
              : 'Esta acción sumará al contador de impresiones y registrará tu usuario en la auditoría física del documento.'
            }
          </p>
        </div>
      </Modal>

    </DashboardLayout>
  );
};

export default Vialidades;
