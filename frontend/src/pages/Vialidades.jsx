import React, { useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button } from '../components/Common';
import { VialidadForm } from '../components/Vialidades/VialidadForm';
import { VialidadDocument } from '../components/Vialidades/VialidadDocument';
import { getVialidadPrintTemplate } from '../utils/VialidadPrintTemplate';

export const Vialidades = () => {
  const [data, setData] = useState({
    numeroRecibo: '178513',
    distrito: '',
    solicitante: '',
    concepto: 'EMPLEADO',
    conMarcaAgua: true,
    ubicacion: '',
    autorizador: 'Ing. Carlos Mendoza (Director de Vialidad)',
    fecha: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  });

  // Generar llave única estable para el documento
  const [llave] = useState(() => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const currentYear = new Date().getFullYear();
    return `VIA-${currentYear}-${randomNum}`;
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://vialidad.gob.sv/verificar/${llave}`;

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);

    // Crear un iframe invisible
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Obtener el HTML con los estilos aplicados
    const htmlContent = getVialidadPrintTemplate(data, llave, qrUrl, data.conMarcaAgua);
    
    // Escribir el HTML al documento del iframe
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

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
      }
    }, 1500);
  };

  const isInvalid = !data.solicitante?.trim() || !data.concepto?.trim() || !data.numeroRecibo?.trim();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Encabezado del Módulo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Generador de Vialidades
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Ingresa los datos para confeccionar el documento en formato oficial de papel bond listo para imprimir.
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={handlePrint} disabled={isInvalid || isPrinting} className="flex items-center gap-2 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.82l2.9-2.9m0 0l2.9 2.9m-2.9-2.9v6c0 1.1.9 2 2 2h2m4-14a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4-8a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h10.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6.75A1.5 1.5 0 015.25 20.25V8.25a1.5 1.5 0 011.5-1.5z" />
              </svg>
              {isPrinting ? 'Preparando...' : 'Imprimir Documento'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Panel de Entrada de Datos (Izquierda) */}
          <div className="lg:col-span-4 print:hidden">
            <VialidadForm data={data} onChange={setData} />
          </div>

          {/* Área de Previsualización (Derecha) */}
          <VialidadDocument data={data} llave={llave} qrUrl={qrUrl} />

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Vialidades;
