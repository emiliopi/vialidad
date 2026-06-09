import api from './axios';

/**
 * Servicio para gestionar los permisos de acceso a menús por rol.
 */
export const permisosService = {
  /**
   * Obtiene todos los roles disponibles en el sistema.
   */
  getRoles: async () => {
    const res = await api.get('/permisos/roles');
    return res.data;
  },

  /**
   * Obtiene todos los menús registrados en el sistema.
   */
  getMenus: async () => {
    const res = await api.get('/permisos/menus');
    return res.data;
  },

  /**
   * Obtiene la lista de IDs de menús autorizados para un rol específico.
   */
  getRoleMenus: async (codigoRol) => {
    const res = await api.get(`/permisos/roles/${codigoRol}/menus`);
    return res.data;
  },

  /**
   * Actualiza los menús autorizados para un rol.
   * Recibe el codigoRol y una lista de IDs de menú.
   */
  updateRoleMenus: async (codigoRol, menuIds) => {
    const res = await api.put(`/permisos/roles/${codigoRol}/menus`, menuIds);
    return res.data;
  }
};

export default permisosService;
