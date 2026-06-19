import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vialidadService } from '../api/vialidadService';
import { configuracionService } from '../api/configuracionService';
import { VialidadDocument } from '../components/Vialidades/VialidadDocument';
import { Button, Input } from '../components/Common';

export const VerificarVialidad = () => {
  const { llave: urlLlave } = useParams();
  
  // Extraer el número de recibo de la query string (?recibo=XXXXXX)
  const queryRecibo = new URLSearchParams(window.location.search).get('recibo') || '';

  // Estados locales para los inputs del formulario manual
  const [llaveInput, setLlaveInput] = useState(urlLlave || '');
  const [reciboInput, setReciboInput] = useState(queryRecibo || '');
  
  // Determina si tenemos ambos datos para realizar la consulta inicial automática
  const hasInitialParams = !!(urlLlave && queryRecibo);

  const [loading, setLoading] = useState(hasInitialParams);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [configLogoCard, setConfigLogoCard] = useState('');
  const [configFirmaAlcaldeHeight, setConfigFirmaAlcaldeHeight] = useState('5rem');
  const [configFirmaAlcaldeTop, setConfigFirmaAlcaldeTop] = useState('-2.5rem');
  const [configFirmaSecretarioHeight, setConfigFirmaSecretarioHeight] = useState('5rem');
  const [configFirmaSecretarioTop, setConfigFirmaSecretarioTop] = useState('-2.5rem');
  const hasCalled = useRef(false);

  useEffect(() => {
    document.title = 'Vialidad Validador';
    
    // Cargar parámetros dinámicos de la configuración
    const loadConfig = async () => {
      try {
        const config = await configuracionService.getConfiguracion();
        setConfigLogoCard(config.logo_card_url || '');
        setConfigFirmaAlcaldeHeight(config.firma_alcalde_height || '5rem');
        setConfigFirmaAlcaldeTop(config.firma_alcalde_top || '-2.5rem');
        setConfigFirmaSecretarioHeight(config.firma_secretario_height || '5rem');
        setConfigFirmaSecretarioTop(config.firma_secretario_top || '-2.5rem');
      } catch (err) {
        console.error('Error al obtener la configuración:', err);
      }
    };
    loadConfig();
  }, []);

  const performVerification = async (targetLlave, targetRecibo) => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      const resData = await vialidadService.verifyVialidad(targetLlave, targetRecibo);
      setResult(resData);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.error || 'No se pudo conectar con el servicio de verificación.';
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialParams && !hasCalled.current) {
      hasCalled.current = true;
      performVerification(urlLlave, queryRecibo);
    }
  }, [urlLlave, queryRecibo, hasInitialParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!llaveInput.trim() || !reciboInput.trim()) {
      setErrorMsg('Debes ingresar tanto la Llave Única como el Número de Recibo.');
      return;
    }
    performVerification(llaveInput.trim(), reciboInput.trim());
  };

  const handleReset = () => {
    setErrorMsg('');
    setResult(null);
    setLlaveInput('');
    setReciboInput('');
    hasCalled.current = false;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans">
      {/* Encabezado Principal */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo_card_frontal.png" alt="Gobierno de El Salvador" className="w-50 h-10 object-contain" />
          </div>
          <span className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-sky-100 dark:border-sky-900/50">
            Validador Oficial
          </span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center">
        {loading ? (
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-700 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">Consultando y verificando documento...</p>
          </div>
        ) : !result && !errorMsg ? (
          /* Formulario de Ingreso de Datos si falta algún parámetro */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-lg space-y-6 text-left">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Verificar Boleta de Vialidad</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Por motivos de seguridad, para validar la autenticidad y visualizaciones debes digitar los datos impresos en el recibo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Llave Única del Documento"
                placeholder="Ej. VIA-2026-123456"
                value={llaveInput}
                onChange={(e) => setLlaveInput(e.target.value)}
                required
              />

              <Input
                label="Número de Recibo / Boleta"
                placeholder="Ej. 178513"
                value={reciboInput}
                onChange={(e) => setReciboInput(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3"
              >
                Verificar Documento
              </Button>
            </form>
          </div>
        ) : errorMsg ? (
          /* Mensaje de Error / No Encontrado */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-lg space-y-5">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto text-3xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Error de Validación</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleReset}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-sm px-6 py-2.5 rounded-xl transition-all"
              >
                Intentar de Nuevo
              </button>
            </div>
          </div>
        ) : !result?.exitoso ? (
          /* Límite alcanzado */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-lg space-y-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto text-3xl">
              🚫
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Límite de Visualizaciones Alcanzado</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {result?.mensaje || 'Este documento ha superado el número de lecturas máximas permitidas por motivos de seguridad.'}
            </p>
            <p className="text-xs text-slate-400 font-mono">Llave: {llaveInput || urlLlave}</p>
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-sm px-6 py-2.5 rounded-xl transition-all"
              >
                Volver a Buscar
              </button>
            </div>
          </div>
        ) : (
          /* Verificación Exitosa */
          <div className="w-full flex flex-col items-center space-y-6">
            {/* Mensaje de Éxito y Contador */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 max-w-4xl w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-sm">
              <div>
                <h3 className="text-emerald-800 dark:text-emerald-400 font-bold text-base flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xl">✅</span> Documento de Vialidad Auténtico
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                  Este documento digital es oficial y ha sido firmado electrónicamente por la municipalidad.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-center shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Visualizaciones Restantes</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{result.visualizaciones_restantes}</p>
              </div>
            </div>

            {/* Renderizar el Documento Previsualizado */}
            <div className="w-full flex justify-center overflow-x-auto py-2">
              <VialidadDocument
                data={{
                  numeroRecibo: result.datos.numero_recibo,
                  distrito: result.datos.distrito,
                  solicitante: result.datos.nombre,
                  concepto: result.datos.concepto,
                  conMarcaAgua: result.datos.con_marca_agua,
                  fecha: result.datos.fecha_emision,
                  fecha_expiracion: result.datos.fecha_expiracion
                }}
                llave={result.datos.llave_unica}
                qrUrl={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  window.location.origin + '/verificar/' + result.datos.llave_unica + '?recibo=' + result.datos.numero_recibo
                )}`}
                precio={result.datos.precio_vialidad}
                firmaAlcaldeUrl={result.datos.firma_alcalde_url}
                firmaSecretarioUrl={result.datos.firma_secretario_url}
                logoCardUrl={configLogoCard}
                firmaAlcaldeHeight={configFirmaAlcaldeHeight}
                firmaAlcaldeTop={configFirmaAlcaldeTop}
                firmaSecretarioHeight={configFirmaSecretarioHeight}
                firmaSecretarioTop={configFirmaSecretarioTop}
              />
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-205 font-bold text-sm px-6 py-2.5 rounded-xl transition-all"
              >
                Buscar Otro Documento
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} Alcaldia de San Salvador Centro. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default VerificarVialidad;
