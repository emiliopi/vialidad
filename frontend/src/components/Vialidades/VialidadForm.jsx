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
      </div>
    </div>
  );
};

export default VialidadForm;
