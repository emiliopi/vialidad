import axios from 'axios';

// Instancia de Axios configurada con la URL de la API y tiempo de espera
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  withCredentials: true, // ← Necesario para que el navegador envíe la cookie httpOnly del refresh_token
});

// Interceptor de Peticiones: Inserta automáticamente el access token JWT si existe en memoria/localStorage
api.interceptors.request.use(
  (config) => {
    // El access_token se guarda en localStorage (corta duración: 15 min).
    // El refresh_token viaja en una cookie httpOnly segura (inaccesible por JS).
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Bandera para evitar múltiples refrescos simultáneos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de Respuestas: Maneja el refresco automático de token ante errores 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si recibimos 401 (No autorizado) y la petición no ha sido reintentada previamente
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si ya hay un refresco en curso, encolar la petición y esperar
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // El refresh_token viaja automáticamente en la cookie httpOnly (withCredentials: true).
        // No necesitamos leerlo de localStorage.
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.access_token;
        localStorage.setItem('token', newAccessToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresco falla, la sesión expiró por completo.
        // Limpiamos el estado local y forzamos el redireccionamiento al login.
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
