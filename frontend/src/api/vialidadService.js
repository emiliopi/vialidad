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
   * Consulta y valida una vialidad de forma pública (decrementa visualizaciones).
   */
  verifyVialidad: async (llave, numeroRecibo) => {
    const res = await api.get(`/vialidades/verificar/${llave}`, {
      params: { numero_recibo: numeroRecibo }
    });
    return res.data;
  }
};

export default vialidadService;
