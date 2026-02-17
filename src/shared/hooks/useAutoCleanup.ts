// Hook para limpieza automática de datos antiguos
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { cleanupService } from '@/core/services/cleanupService';

interface UseAutoCleanupOptions {
  enabled?: boolean;
  intervalMinutes?: number; // Intervalo de limpieza en minutos
  daysToKeep?: number; // Días de datos a mantener
}

export function useAutoCleanup(options: UseAutoCleanupOptions = {}) {
  const {
    enabled = true,
    intervalMinutes = 60, // Por defecto cada hora
    daysToKeep = 7, // Por defecto mantener 7 días
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Función de limpieza
  const performCleanup = async () => {
    if (!enabled) return;

    try {
      console.log('🧹 Ejecutando limpieza automática...');
      const result = await cleanupService.cleanupOldData(
        daysToKeep,
        daysToKeep,
        daysToKeep,
        30 // Mantener 30 días de historial de emociones
      );

      if (result) {
        const totalDeleted =
          result.messages_deleted +
          result.voice_notes_deleted +
          result.images_deleted;

        if (totalDeleted > 0) {
          console.log(`✅ Limpieza completada: ${totalDeleted} elementos borrados`);
          console.log(`   • Mensajes: ${result.messages_deleted}`);
          console.log(`   • Notas de voz: ${result.voice_notes_deleted}`);
          console.log(`   • Imágenes: ${result.images_deleted}`);
        } else {
          console.log('ℹ️ No hay datos antiguos para limpiar');
        }
      }
    } catch (error) {
      console.error('❌ Error en limpieza automática:', error);
    }
  };

  // Ejecutar limpieza cuando la app vuelve al foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App volvió al foreground, ejecutar limpieza
        performCleanup();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, daysToKeep]);

  // Ejecutar limpieza periódicamente
  useEffect(() => {
    if (!enabled) return;

    // Ejecutar inmediatamente al montar
    performCleanup();

    // Configurar intervalo
    const intervalMs = intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(performCleanup, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMinutes, daysToKeep]);

  return {
    performCleanup,
  };
}
