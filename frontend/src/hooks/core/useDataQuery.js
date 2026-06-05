import { useQuery } from '@tanstack/react-query';

/**
 * Hook personalizado para simplificar las consultas de datos en la aplicación.
 * Integra de forma transparente las opciones de configuración global.
 */
export const useDataQuery = (queryKey, fetchFn, options = {}) => {
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: options.enabled !== undefined ? options.enabled : true,
    ...options,
  });
};

export default useDataQuery;
