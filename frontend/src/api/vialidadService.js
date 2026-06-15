import api from './axios';

/**
 * Servicio para gestionar la emisión e impresión de boletas de vialidad
 * y su correspondiente verificación de visualizaciones.
 */
export const vialidadService = {
  /**
   * Registra una nueva vialidad emitida en la base de datos.
   */
  createVialidad: async (vialidadData) => {
    const res = await api.post('/vialidades/', vialidadData);
    return res.data;
  },

  /**
   * Registra múltiples vialidades en una sola transacción (máx. 500).
   */
  createVialidadesBulk: async (bulkPayload) => {
    const res = await api.post('/vialidades/bulk', bulkPayload);
    return res.data;
  },

  /**
   * Obtiene el siguiente número de recibo correlativo disponible.
   */
  getSiguienteRecibo: async () => {
    const res = await api.get('/vialidades/siguiente-recibo');
    return res.data;
  },

  /**
   * Obtiene el listado de vialidades emitidas de forma paginada.
   */
  getVialidades: async (page = 1, limit = 10, search = '') => {
    const res = await api.get('/vialidades/', {
      params: { page, limit, search }
    });
    return res.data;
  },

  /**
   * Consulta y valida una vialidad de forma pública (decrementa visualizaciones).
   */
  verifyVialidad: async (llave, numeroRecibo) => {
    const res = await api.get(`/vialidades/verificar/${llave}`, {
      params: { numero_recibo: numeroRecibo }
    });
    return res.data;
  },

  /**
   * Obtiene estadísticas de las vialidades emitidas en un rango de fechas.
   */
  getEstadisticas: async (fechaInicio = '', fechaFin = '') => {
    const res = await api.get('/vialidades/estadisticas', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
    return res.data;
  }
};

export default vialidadService;
