import React from 'react';

export const VialidadForm = ({ data, onChange }) => {
  const handleChange = (key, value) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 print:hidden">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        Datos del Documento
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Número de Recibo *
          </label>
          <input
            type="text"
            value={data.numeroRecibo || ''}
            onChange={(e) => handleChange('numeroRecibo', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none"
            placeholder="Ej. 178513"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Municipio / Distrito (Opcional)
          </label>
          <input
            type="text"
            value={data.distrito || ''}
            onChange={(e) => handleChange('distrito', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none"
            placeholder="Ej. San Salvador"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Contribuyente *
          </label>
          <input
            type="text"
            value={data.solicitante}
            onChange={(e) => handleChange('solicitante', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none"
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Concepto
          </label>
          <input
            type="text"
            value={data.concepto}
            onChange={(e) => handleChange('concepto', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none"
            placeholder="Ej. Acceso Vial"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="conMarcaAgua"
            checked={data.conMarcaAgua ?? true}
            onChange={(e) => handleChange('conMarcaAgua', e.target.checked)}
            className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 focus:outline-none cursor-pointer"
          />
          <label htmlFor="conMarcaAgua" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            Incluir Marca de Agua en Impresión
          </label>
        </div>
      </div>
    </div>
  );
};

export default VialidadForm;
