import api from './axios';

/**
 * Realiza la petición de inicio de sesión.
 * El servidor devuelve el access_token en el body y setea el refresh_token
 * como cookie httpOnly automáticamente (inaccesible por JavaScript).
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { username: email, password });
  return response.data;
};

/**
 * Registra un nuevo usuario en el sistema.
 * El rol es asignado por el servidor (siempre Admin, el de menor privilegio).
 */
export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

/**
 * Cierra la sesión de forma segura:
 * 1. Llama al backend para invalidar el refresh_token en la BD.
 * 2. El backend elimina la cookie httpOnly del navegador.
 * 3. Se limpia el estado local.
 */
export const logout = async () => {
  try {
    // Llamada al backend con el access_token vigente para invalidar la sesión en BD
    await api.post('/auth/logout');
  } catch {
    // Aunque falle la llamada al backend, limpiamos el estado local igualmente
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Consulta la información del perfil del usuario actualmente autenticado.
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
