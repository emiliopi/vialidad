import React, { useState, useEffect } from 'react';
import { Input, Checkbox, Select } from '../Common';
import { distritoService } from '../../api/distritoService';
import { conceptoService } from '../../api/conceptoService';

export const VialidadForm = ({ data, onChange }) => {
  const [distritos, setDistritos] = useState([]);
  const [conceptos, setConceptos] = useState([]);

  useEffect(() => {
    const loadFormFields = async () => {
      try {
        const distRes = await distritoService.getDistritos(1, 100);
        const activeDistritos = (distRes.items || []).filter(d => d.activo);
        setDistritos(activeDistritos);

        const concRes = await conceptoService.getConceptos(1, 100);
        const activeConceptos = (concRes.items || []).filter(c => c.activo);
        setConceptos(activeConceptos);
      } catch (err) {
        console.error("Error al cargar datos en el formulario de vialidades:", err);
      }
    };
    loadFormFields();
  }, []);

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

        <Select
          label="Municipio / Distrito (Opcional)"
          value={data.distrito || ''}
          onChange={(e) => handleChange('distrito', e.target.value)}
          placeholder="Selecciona un distrito..."
          searchable={true}
          options={distritos.map(d => ({ value: d.nombre, label: d.nombre }))}
        />


        <Input
          label="Contribuyente *"
          value={data.solicitante || ''}
          onChange={(e) => handleChange('solicitante', e.target.value)}
          placeholder="Ej. Juan Pérez"
          required
        />

        <Select
          label="Concepto *"
          value={data.concepto || ''}
          onChange={(e) => handleChange('concepto', e.target.value)}
          placeholder="Selecciona un concepto..."
          searchable={true}
          options={conceptos.map(c => ({ value: c.nombre, label: c.nombre }))}
        />

        <Input
          label="Límite de Visualizaciones *"
          type="number"
          value={data.max_visualizaciones !== undefined ? data.max_visualizaciones : 5}
          onChange={(e) => handleChange('max_visualizaciones', e.target.value === '' ? '' : parseInt(e.target.value))}
          placeholder="Ej. 5"
          min="1"
          required
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
