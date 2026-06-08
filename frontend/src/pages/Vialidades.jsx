import React, { useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button } from '../components/Common';
import { VialidadForm } from '../components/Vialidades/VialidadForm';
import { VialidadDocument } from '../components/Vialidades/VialidadDocument';

export const Vialidades = () => {
  const [data, setData] = useState({
    distrito: '',
    solicitante: '',
    concepto: 'EMPLEADO',
    ubicacion: '',
    autorizador: 'Ing. Carlos Mendoza (Director de Vialidad)',
    fecha: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  });

  const handlePrint = () => {
    window.print();
  };

  const isInvalid = !data.solicitante?.trim() || !data.concepto?.trim();

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
            <Button variant="primary" onClick={handlePrint} disabled={isInvalid} className="flex items-center gap-2 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.82l2.9-2.9m0 0l2.9 2.9m-2.9-2.9v6c0 1.1.9 2 2 2h2m4-14a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4-8a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h10.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6.75A1.5 1.5 0 015.25 20.25V8.25a1.5 1.5 0 011.5-1.5z" />
              </svg>
              Imprimir Documento
            </Button>
          </div>
        </div>

        {/* Estilos específicos para impresión limpia de la hoja de papel bond */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            /* Ocultar todo el layout del dashboard y controles */
            aside, header, .print\\:hidden, button, input, label, select, textarea {
              display: none !important;
            }
            /* Resetear márgenes y paddings del contenedor principal */
            .lg\\:pl-64, main, .max-w-7xl, .grid {
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
              width: 100% !important;
            }
            /* Estilo único del área de impresión */
            #print-area {
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 2cm !important;
              min-height: auto !important;
              display: block !important;
              position: static !important;
            }
          }
        `}} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Panel de Entrada de Datos (Izquierda) */}
          <div className="lg:col-span-4 print:hidden">
            <VialidadForm data={data} onChange={setData} />
          </div>

          {/* Área de Previsualización (Derecha) */}
          <VialidadDocument data={data} />

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Vialidades;
