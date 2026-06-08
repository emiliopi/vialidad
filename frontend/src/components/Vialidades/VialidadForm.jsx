import React from 'react';
import { Input, Checkbox } from '../Common';

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
        <Input
          label="Número de Recibo *"
          value={data.numeroRecibo || ''}
          onChange={(e) => handleChange('numeroRecibo', e.target.value)}
          placeholder="Ej. 178513"
          required
        />

        <Input
          label="Municipio / Distrito (Opcional)"
          value={data.distrito || ''}
          onChange={(e) => handleChange('distrito', e.target.value)}
          placeholder="Ej. San Salvador"
        />

        <Input
          label="Contribuyente *"
          value={data.solicitante || ''}
          onChange={(e) => handleChange('solicitante', e.target.value)}
          placeholder="Ej. Juan Pérez"
          required
        />

        <Input
          label="Concepto"
          value={data.concepto || ''}
          onChange={(e) => handleChange('concepto', e.target.value)}
          placeholder="Ej. Acceso Vial"
        />

        <Checkbox
          checked={data.conMarcaAgua ?? true}
          onChange={(e) => handleChange('conMarcaAgua', e.target.checked)}
          label="Incluir Marca de Agua en Impresión"
          className="pt-2"
        />
      </div>
    </div>
  );
};

export default VialidadForm;
