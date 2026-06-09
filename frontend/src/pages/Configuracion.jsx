import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, Input } from '../components/Common';
import { configuracionService } from '../api/configuracionService';

export const Configuracion = () => {
  const [precio, setPrecio] = useState('3.43');
  const [firmaAlcaldeUrl, setFirmaAlcaldeUrl] = useState('');
  const [firmaSecretarioUrl, setFirmaSecretarioUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPrecio, setSavingPrecio] = useState(false);
  const [uploadingAlcalde, setUploadingAlcalde] = useState(false);
  const [uploadingSecretario, setUploadingSecretario] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  // URL base del backend para servir los estáticos (firmas)
  const backendBaseUrl = 'http://localhost:8000';

  useEffect(() => {
    fetchConfiguracion();
  }, []);

  const fetchConfiguracion = async () => {
    setLoading(true);
    try {
      const data = await configuracionService.getConfiguracion();
      setPrecio(String(data.precio_vialidad));
      setFirmaAlcaldeUrl(data.firma_alcalde_url || '');
      setFirmaSecretarioUrl(data.firma_secretario_url || '');
    } catch (err) {
      logger.error('Error al obtener la configuración:', err);
      toast.error('No se pudo cargar la configuración de vialidades.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrecio = async (e) => {
    e.preventDefault();
    if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
      toast.error('Por favor, ingresa un precio válido mayor a 0.');
      return;
    }
    setSavingPrecio(true);
    try {
      await configuracionService.updatePrecio(parseFloat(precio));
      toast.success('Precio de vialidad actualizado con éxito.');
    } catch (err) {
      toast.error('Error al actualizar el precio.');
    } finally {
      setSavingPrecio(false);
    }
  };

  const handleUploadFirma = async (tipo, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validExtensions.includes(file.type)) {
      toast.error('Por favor, selecciona una imagen válida (PNG, JPG, SVG).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    if (tipo === 'alcalde') {
      setUploadingAlcalde(true);
    } else {
      setUploadingSecretario(true);
    }

    try {
      const data = await configuracionService.uploadFirma(tipo, formData);
      if (tipo === 'alcalde') {
        setFirmaAlcaldeUrl(data.firma_alcalde_url);
      } else {
        setFirmaSecretarioUrl(data.firma_secretario_url);
      }
      setCacheBuster(Date.now()); // Forzar recarga de imagen en caché del navegador
      toast.success(`Firma del ${tipo} cargada exitosamente.`);
    } catch (err) {
      toast.error(`Error al subir la firma del ${tipo}.`);
    } finally {
      if (tipo === 'alcalde') {
        setUploadingAlcalde(false);
      } else {
        setUploadingSecretario(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Encabezado */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Configuración del Módulo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Administra los valores globales de la boleta de vialidad, como el costo y las firmas oficiales del Alcalde y Secretario.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando parámetros de configuración...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Panel de Configuración General/Precio (Izquierda) */}
            <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                Precio de Vialidad
              </h3>
              <form onSubmit={handleSavePrecio} className="space-y-4">
                <Input
                  label="Precio de la Boleta ($) *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ej. 3.43"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center shadow-md"
                  disabled={savingPrecio}
                >
                  {savingPrecio ? 'Guardando...' : 'Guardar Precio'}
                </Button>
              </form>
            </div>

            {/* Panel de Firmas (Derecha) */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                Firmas Oficiales Autorizadas
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Firma del Alcalde */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Alcalde o Delegado
                  </span>
                  
                  <div className="w-full h-32 border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden relative group">
                    {firmaAlcaldeUrl ? (
                      <img
                        src={`${backendBaseUrl}${firmaAlcaldeUrl}?t=${cacheBuster}`}
                        alt="Firma del Alcalde"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center text-slate-400 p-4">
                        <svg className="w-8 h-8 mx-auto mb-1.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span className="text-xs">Sin firma asignada (usa la firma por defecto)</span>
                      </div>
                    )}
                    {uploadingAlcalde && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <label className="w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadFirma('alcalde', e)}
                      className="hidden"
                    />
                    <div className="w-full text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-700/50">
                      Cargar nueva firma
                    </div>
                  </label>
                </div>

                {/* Firma del Secretario */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Secretario Municipal
                  </span>
                  
                  <div className="w-full h-32 border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden relative group">
                    {firmaSecretarioUrl ? (
                      <img
                        src={`${backendBaseUrl}${firmaSecretarioUrl}?t=${cacheBuster}`}
                        alt="Firma del Secretario"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center text-slate-400 p-4">
                        <svg className="w-8 h-8 mx-auto mb-1.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span className="text-xs">Sin firma asignada (usa la firma por defecto)</span>
                      </div>
                    )}
                    {uploadingSecretario && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <label className="w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadFirma('secretario', e)}
                      className="hidden"
                    />
                    <div className="w-full text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-700/50">
                      Cargar nueva firma
                    </div>
                  </label>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Configuracion;
