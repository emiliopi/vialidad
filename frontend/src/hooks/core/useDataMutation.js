import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getSafeErrorMessage } from '../../utils/errors';

/**
 * Hook personalizado para simplificar las mutaciones (POST, PUT, DELETE).
 * Gestiona automáticamente el refresco de consultas y muestra mensajes de error a través de toasts.
 */
export const useDataMutation = (mutationFn, invalidateKey = null, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalida automáticamente queries asociadas si se provee una clave
      if (invalidateKey) {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(invalidateKey) ? invalidateKey : [invalidateKey],
        });
      }
      options.onSuccess?.(data, variables, context);
    },
    onError: (err) => {
      const msg = getSafeErrorMessage(err);
      toast.error(msg);
      options.onError?.(err);
    },
    ...options,
  });
};

export default useDataMutation;
