// Servicio para limpiar datos sensibles de la base de datos
import { supabase } from '@/core/config/supabase';
import { Alert } from 'react-native';

interface CleanupResult {
  messages_deleted: number;
  voice_notes_deleted: number;
  voice_storage_paths: string[] | null;
  images_deleted: number;
  image_storage_paths: string[] | null;
  emotional_states_deleted?: number;
  cleaned_at: string;
}

class CleanupService {
  /**
   * Limpia todos los datos antiguos (más de X días)
   */
  async cleanupOldData(
    messageDays: number = 7,
    voiceDays: number = 7,
    imageDays: number = 7,
    emotionDays: number = 30
  ): Promise<CleanupResult | null> {
    try {
      const { data, error } = await supabase.rpc('cleanup_all_old_data', {
        message_days: messageDays,
        voice_days: voiceDays,
        image_days: imageDays,
        emotion_days: emotionDays,
      });

      if (error) throw error;

      const result = data as CleanupResult;

      // Borrar archivos de storage
      if (result.voice_storage_paths && result.voice_storage_paths.length > 0) {
        await this.deleteStorageFiles('voice-notes', result.voice_storage_paths);
      }

      if (result.image_storage_paths && result.image_storage_paths.length > 0) {
        await this.deleteStorageFiles('private-images', result.image_storage_paths);
      }

      // console.log('🧹 Limpieza completada:', result);
      return result;
    } catch (error) {
      console.error('Error en limpieza automática:', error);
      return null;
    }
  }

  /**
   * Borra TODO el historial de la pareja actual
   */
  async deleteCoupleHistory(coupleId: string): Promise<CleanupResult | null> {
    try {
      const { data, error } = await supabase.rpc('delete_couple_history', {
        couple_uuid: coupleId,
      });

      if (error) throw error;

      const result = data as CleanupResult;

      // Borrar archivos de storage
      if (result.voice_storage_paths && result.voice_storage_paths.length > 0) {
        await this.deleteStorageFiles('voice-notes', result.voice_storage_paths);
      }

      if (result.image_storage_paths && result.image_storage_paths.length > 0) {
        await this.deleteStorageFiles('private-images', result.image_storage_paths);
      }

      console.log('🗑️ Historial de pareja borrado:', result);
      return result;
    } catch (error) {
      console.error('Error borrando historial de pareja:', error);
      return null;
    }
  }

  /**
   * Borra archivos de un bucket de storage
   */
  private async deleteStorageFiles(bucket: string, paths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);

      if (error) {
        console.error(`Error borrando archivos de ${bucket}:`, error);
      } else {
        console.log(`✅ ${paths.length} archivos borrados de ${bucket}`);
      }
    } catch (error) {
      console.error(`Error borrando archivos de ${bucket}:`, error);
    }
  }

  /**
   * Borra TODO el historial con confirmación del usuario
   */
  async deleteAllHistoryWithConfirmation(coupleId: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '⚠️ Borrar todo el historial',
        'Esto borrará permanentemente:\n\n• Todos los mensajes\n• Todas las notas de voz\n• Todas las imágenes privadas\n\n¿Estás seguro?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Borrar todo',
            style: 'destructive',
            onPress: async () => {
              const result = await this.deleteCoupleHistory(coupleId);
              if (result) {
                Alert.alert(
                  '✅ Historial borrado',
                  `Se borraron:\n• ${result.messages_deleted} mensajes\n• ${result.voice_notes_deleted} notas de voz\n• ${result.images_deleted} imágenes`
                );
                resolve(true);
              } else {
                Alert.alert('Error', 'No se pudo borrar el historial');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  }

  /**
   * Limpia datos antiguos automáticamente (sin confirmación)
   * Útil para ejecutar periódicamente en background
   */
  async autoCleanup(): Promise<void> {
    try {
      const result = await this.cleanupOldData(7, 7, 7, 30);
      
      if (result) {
        const totalDeleted =
          result.messages_deleted +
          result.voice_notes_deleted +
          result.images_deleted;

        if (totalDeleted > 0) {
          console.log(`🧹 Auto-limpieza: ${totalDeleted} elementos borrados`);
        }
      }
    } catch (error) {
      console.error('Error en auto-limpieza:', error);
    }
  }
}

export const cleanupService = new CleanupService();
