/**
 * Extrae de forma segura el mensaje de error retornado por una respuesta HTTP o excepción.
 */
export const getSafeErrorMessage = (error, fallback = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.') => {
  if (error?.response?.data?.detail) {
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
    if (Array.isArray(error.response.data.detail) && error.response.data.detail.length > 0) {
      return error.response.data.detail[0]?.msg || fallback;
    }
  }
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  
  return fallback;
};

export default getSafeErrorMessage;
