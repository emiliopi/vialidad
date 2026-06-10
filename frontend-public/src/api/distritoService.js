import api from './axios';

/**
 * Servicio para interactuar con los endpoints de gestión de distritos en el backend.
 */
export const distritoService = {
  /**
   * Obtiene la lista de distritos paginada y con filtros opcionales.
   */
  getDistritos: async (page = 1, limit = 10, search = '') => {
    const res = await api.get('/distritos/', {
      params: { page, limit, search }
    });
    return res.data;
  },

  /**
   * Obtiene un distrito específico por su ID.
   */
  getDistrito: async (id) => {
    const res = await api.get(`/distritos/${id}`);
    return res.data;
  },

  /**
   * Crea un nuevo distrito.
   */
  createDistrito: async (distritoData) => {
    const res = await api.post('/distritos/', distritoData);
    return res.data;
  },

  /**
   * Actualiza un distrito existente por su ID.
   */
  updateDistrito: async (id, distritoData) => {
    const res = await api.put(`/distritos/${id}`, distritoData);
    return res.data;
  },

  /**
   * Elimina un distrito por su ID.
   */
  deleteDistrito: async (id) => {
    const res = await api.delete(`/distritos/${id}`);
    return res.data;
  }
};

export default distritoService;
