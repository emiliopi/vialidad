import api from './axios';

/**
 * Servicio para gestionar la configuración de vialidad (precio y firmas).
 */
export const configuracionService = {
  /**
   * Obtiene la configuración global de precio y firmas.
   */
  getConfiguracion: async () => {
    const res = await api.get('/configuracion/');
    return res.data;
  },

  /**
   * Actualiza el precio global de la vialidad.
   */
  updatePrecio: async (precio) => {
    const res = await api.put('/configuracion/', { precio_vialidad: precio });
    return res.data;
  },

  /**
   * Carga el archivo de firma para el Alcalde o Secretario.
   * Recibe el tipo ("alcalde" o "secretario") y un objeto FormData con el archivo.
   */
  uploadFirma: async (tipo, formData) => {
    const res = await api.post(`/configuracion/cargar-firma/${tipo}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};

export default configuracionService;
