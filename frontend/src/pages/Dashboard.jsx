import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Button, DateRangePicker } from '../components/Common';
import { toast } from 'react-hot-toast';
import { vialidadService } from '../api/vialidadService';

export const Dashboard = () => {
  let user = { username: 'Usuario', role: 'Invitado', email: '' };
  try {
    const stored = localStorage.getItem('user');
    if (stored) user = JSON.parse(stored);
  } catch {
    localStorage.removeItem('user');
  }

  // Obtener fechas por defecto (últimos 30 días)
  const getPastDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [fechaInicio, setFechaInicio] = useState(getPastDateString(30));
  const [fechaFin, setFechaFin] = useState(getTodayString());
  const [stats, setStats] = useState({
    total_periodo: 0,
    total_historico: 0,
    distritos: [],
    conceptos: [],
    timeline: []
  });
  const [loading, setLoading] = useState(true);
  const [timelinePage, setTimelinePage] = useState(1);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await vialidadService.getEstadisticas(fechaInicio, fechaFin);
      setStats(data);
      setTimelinePage(1);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar las estadísticas del panel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fechaInicio, fechaFin]);

  const handleDateChange = (start, end) => {
    setFechaInicio(start);
    setFechaFin(end);
  };

  const handleResetFilters = () => {
    setFechaInicio(getPastDateString(30));
    setFechaFin(getTodayString());
  };

  // Calcular promedio de emisiones diarias en el rango
  const calcularPromedioDiario = () => {
    if (stats.timeline.length === 0) return 0;
    return (stats.total_periodo / stats.timeline.length).toFixed(1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Encabezado y Filtros */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
              Panel de Control
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Estadísticas e historial de emisión de boletas de vialidades.
            </p>
          </div>

          {/* Selector de Rango de Fechas Personalizado */}
          <DateRangePicker
            startDate={fechaInicio}
            endDate={fechaFin}
            onChange={handleDateChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Carga General */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Procesando y agregando métricas de emisión...</p>
          </div>
        ) : (
          <>
            {/* Grid de Tarjetas de Métricas usando los colores primarios de la plantilla (#101c4e) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Emitidas en el Período
                </p>
                <h2 className="text-3xl font-black text-primary dark:text-sky-450 mt-2.5 font-display">
                  {stats.total_periodo.toLocaleString()}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Rango de fechas actual
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/15 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Total Histórico Emitidas
                </p>
                <h2 className="text-3xl font-black text-primary dark:text-sky-450 mt-2.5 font-display">
                  {stats.total_historico.toLocaleString()}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-light inline-block" />
                  Acumulado de la plataforma
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Promedio Diario
                </p>
                <h2 className="text-3xl font-black text-primary dark:text-sky-450 mt-2.5 font-display">
                  {calcularPromedioDiario()}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-dark inline-block" />
                  Vialidades por día activo
                </p>
              </div>

            </div>

            {/* Grid de Distribuciones (Distritos y Conceptos) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Emisiones por Distrito */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Distribución por Distritos
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Vialidades emitidas según el distrito registrado.</p>
                </div>

                {stats.distritos.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No hay datos de distritos en este período.</p>
                ) : (
                  <div className="space-y-4">
                    {stats.distritos.map((d, index) => {
                      const porcentaje = ((d.total / Math.max(1, stats.total_periodo)) * 100).toFixed(0);
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">{d.distrito}</span>
                            <span className="text-slate-400">{d.total} ({porcentaje}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${porcentaje}%` }}
                              className="h-full bg-gradient-to-r from-primary-light to-primary dark:from-sky-500 dark:to-primary rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Emisiones por Concepto */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Distribución por Conceptos
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Clasificación de las vialidades según su concepto de emisión.</p>
                </div>

                {stats.conceptos.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No hay datos de conceptos en este período.</p>
                ) : (
                  <div className="space-y-4">
                    {stats.conceptos.map((c, index) => {
                      const porcentaje = ((c.total / Math.max(1, stats.total_periodo)) * 100).toFixed(0);
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">{c.concepto}</span>
                            <span className="text-slate-400">{c.total} ({porcentaje}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${porcentaje}%` }}
                              className="h-full bg-gradient-to-r from-primary-light to-primary dark:from-sky-500 dark:to-primary rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Historial Timeline de Emisiones */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Línea de Tiempo Diaria
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Historial cronológico de emisiones de vialidades en el rango seleccionado.</p>
              </div>

              {stats.timeline.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No se registraron emisiones de vialidades en el período seleccionado.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-3.5 w-16">#</th>
                          <th className="px-6 py-3.5">Fecha</th>
                          <th className="px-6 py-3.5">Vialidades Emitidas</th>
                          <th className="px-6 py-3.5 text-right">Proporción Diaria</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {stats.timeline
                          .slice((timelinePage - 1) * 10, timelinePage * 10)
                          .map((t, index) => {
                            const porcentaje = ((t.total / Math.max(1, stats.total_periodo)) * 100).toFixed(0);
                            return (
                              <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-400 dark:text-slate-500">
                                  {(timelinePage - 1) * 10 + index + 1}
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                                  {new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="px-6 py-4 font-bold text-primary dark:text-sky-400">
                                  {t.total}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold">
                                    {porcentaje}% del período
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginador Local Numerado */}
                  {Math.ceil(stats.timeline.length / 10) > 1 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Mostrando página {timelinePage} de {Math.ceil(stats.timeline.length / 10)} ({stats.timeline.length} días registrados)
                      </span>
                      <div className="flex gap-1.5 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={timelinePage === 1}
                          onClick={() => setTimelinePage((prev) => Math.max(1, prev - 1))}
                        >
                          Anterior
                        </Button>
                        {Array.from({ length: Math.ceil(stats.timeline.length / 10) }, (_, i) => i + 1)
                          .filter((p) => {
                            const totalPages = Math.ceil(stats.timeline.length / 10);
                            return p === 1 || p === totalPages || Math.abs(p - timelinePage) <= 2;
                          })
                          .map((p, idx, arr) => {
                            const totalPages = Math.ceil(stats.timeline.length / 10);
                            return (
                              <React.Fragment key={p}>
                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                  <span className="text-slate-400 text-xs px-1">...</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setTimelinePage(p)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                                    timelinePage === p
                                      ? 'bg-primary text-white border-primary dark:bg-sky-500 dark:border-sky-500'
                                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/45'
                                  }`}
                                >
                                  {p}
                                </button>
                              </React.Fragment>
                            );
                          })}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={timelinePage === Math.ceil(stats.timeline.length / 10)}
                          onClick={() => setTimelinePage((prev) => Math.min(Math.ceil(stats.timeline.length / 10), prev + 1))}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
