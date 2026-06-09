import api from './axios';

/**
 * Servicio para interactuar con los endpoints de gestión de conceptos en el backend.
 */
export const conceptoService = {
  /**
   * Obtiene la lista de conceptos paginada y con filtros opcionales.
   */
  getConceptos: async (page = 1, limit = 10, search = '') => {
    const res = await api.get('/conceptos/', {
      params: { page, limit, search }
    });
    return res.data;
  },

  /**
   * Obtiene un concepto específico por su ID.
   */
  getConcepto: async (id) => {
    const res = await api.get(`/conceptos/${id}`);
    return res.data;
  },

  /**
   * Crea un nuevo concepto.
   */
  createConcepto: async (conceptoData) => {
    const res = await api.post('/conceptos/', conceptoData);
    return res.data;
  },

  /**
   * Actualiza un concepto existente por su ID.
   */
  updateConcepto: async (id, conceptoData) => {
    const res = await api.put(`/conceptos/${id}`, conceptoData);
    return res.data;
  },

  /**
   * Elimina un concepto por su ID.
   */
  deleteConcepto: async (id) => {
    const res = await api.delete(`/conceptos/${id}`);
    return res.data;
  }
};

export default conceptoService;
