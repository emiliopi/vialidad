import { useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi, getMe } from '../api/authService';

/**
 * Hook para centralizar la autenticación del usuario.
 * 
 * - El access_token (corta duración: 15 min) se persiste en localStorage.
 * - El refresh_token (larga duración: 7 días) viaja en una cookie httpOnly
 *   configurada por el servidor (inaccesible por JavaScript → protección XSS).
 */
export const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      // Si el JSON está corrupto, limpiar y tratar como sesión inválida
      localStorage.removeItem('user');
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Sincronizar el perfil del usuario con la base de datos al inicializar o reconectar
  useEffect(() => {
    const syncProfile = async () => {
      if (isAuthenticated) {
        try {
          const profile = await getMe();
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
        } catch (err) {
          console.error('Error al sincronizar perfil de usuario:', err);
        }
      }
    };
    syncProfile();
  }, [isAuthenticated]);

  /**
   * Procesa la solicitud de login de la API.
   * Almacena el access_token y los datos del usuario en localStorage.
   * El refresh_token es gestionado automáticamente por la cookie del servidor.
   */
  const login = async (email, password) => {
    const data = await loginApi(email, password);
    localStorage.setItem('token', data.access_token);
    // NO guardamos refresh_token: viene y va automáticamente en cookie httpOnly
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  /**
   * Cierra la sesión activa:
   * - Llama al backend para invalidar el refresh_token en BD.
   * - El backend elimina la cookie httpOnly del cliente.
   * - Limpia el estado local.
   */
  const logout = async () => {
    await logoutApi();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
};

export default useAuth;
