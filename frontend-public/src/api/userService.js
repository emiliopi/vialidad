import api from './axios';

/**
 * Servicio para interactuar con los endpoints de gestión de usuarios en el backend.
 */
export const userService = {
  /**
   * Obtiene la lista de usuarios paginada y con filtros opcionales.
   */
  getUsers: async (page = 1, limit = 10, search = '') => {
    const res = await api.get('/users/', {
      params: { page, limit, search }
    });
    return res.data;
  },

  /**
   * Obtiene los roles disponibles en la base de datos.
   */
  getRoles: async () => {
    const res = await api.get('/users/roles');
    return res.data;
  },

  /**
   * Crea un nuevo usuario.
   */
  createUser: async (userData) => {
    const res = await api.post('/users/', userData);
    return res.data;
  },

  /**
   * Actualiza un usuario existente por su ID.
   */
  updateUser: async (id, userData) => {
    const res = await api.put(`/users/${id}`, userData);
    return res.data;
  },

  /**
   * Elimina un usuario por su ID.
   */
  deleteUser: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
};

export default userService;
