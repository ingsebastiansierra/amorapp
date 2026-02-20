import { useRef } from 'react';
import { Alert } from 'react-native';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  message?: string;
}

/**
 * Hook para limitar la frecuencia de acciones del usuario
 * Previene spam y abuso
 * 
 * @example
 * const { checkLimit } = useRateLimit({
 *   maxAttempts: 5,
 *   windowMs: 60000, // 1 minuto
 *   message: 'Espera un momento antes de enviar otro mensaje'
 * });
 * 
 * const handleAction = () => {
 *   if (!checkLimit()) return;
 *   // Continuar con la acción...
 * };
 */
export const useRateLimit = (config: RateLimitConfig) => {
  const attempts = useRef<number[]>([]);

  const checkLimit = (): boolean => {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Limpiar intentos antiguos fuera de la ventana de tiempo
    attempts.current = attempts.current.filter(time => time > windowStart);

    // Verificar si se alcanzó el límite
    if (attempts.current.length >= config.maxAttempts) {
      Alert.alert(
        'Espera un momento',
        config.message || 'Estás haciendo esto muy rápido. Espera un momento.'
      );
      return false;
    }

    // Registrar este intento
    attempts.current.push(now);
    return true;
  };

  const reset = () => {
    attempts.current = [];
  };

  const getRemainingAttempts = (): number => {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const recentAttempts = attempts.current.filter(time => time > windowStart);
    return Math.max(0, config.maxAttempts - recentAttempts.length);
  };

  return { 
    checkLimit, 
    reset,
    getRemainingAttempts 
  };
};
