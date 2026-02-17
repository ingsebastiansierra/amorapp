// Servicio para gestionar relaciones de pareja
import { supabase } from '@/core/config/supabase';
import { autoCleanupManager } from './autoCleanupManager';
import { Alert } from 'react-native';

class RelationshipService {
  /**
   * Terminar relación y borrar todo el historial
   */
  async endRelationship(userId: string): Promise<boolean> {
    try {
      // Obtener información de la pareja
      const { data: userData } = await supabase
        .from('users')
        .select('couple_id')
        .eq('id', userId)
        .single();

      if (!userData?.couple_id) {
        Alert.alert('Error', 'No tienes una relación activa');
        return false;
      }

      const coupleId = userData.couple_id;

      // Confirmar con el usuario
      return new Promise((resolve) => {
        Alert.alert(
          '💔 Terminar relación',
          'Esto borrará permanentemente:\n\n• Todos los mensajes\n• Todas las notas de voz\n• Todas las imágenes privadas\n• Todo el historial compartido\n\n¿Estás seguro?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Terminar relación',
              style: 'destructive',
              onPress: async () => {
                // Borrar todo el historial
                const cleaned = await autoCleanupManager.cleanupOnRelationshipEnd(coupleId);

                if (cleaned) {
                  // Desconectar usuarios de la pareja
                  await supabase
                    .from('users')
                    .update({ couple_id: null })
                    .eq('couple_id', coupleId);

                  // Borrar registro de pareja
                  await supabase
                    .from('couples')
                    .delete()
                    .eq('id', coupleId);

                  Alert.alert(
                    '✅ Relación terminada',
                    'Todo el historial ha sido borrado permanentemente'
                  );
                  resolve(true);
                } else {
                  Alert.alert('Error', 'No se pudo terminar la relación');
                  resolve(false);
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error terminando relación:', error);
      Alert.alert('Error', 'No se pudo terminar la relación');
      return false;
    }
  }

  /**
   * Limpiar historial sin terminar la relación
   */
  async clearHistory(userId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('couple_id')
        .eq('id', userId)
        .single();

      if (!userData?.couple_id) {
        Alert.alert('Error', 'No tienes una relación activa');
        return false;
      }

      return new Promise((resolve) => {
        Alert.alert(
          '🗑️ Limpiar historial',
          'Esto borrará permanentemente:\n\n• Todos los mensajes\n• Todas las notas de voz\n• Todas las imágenes privadas\n\nLa relación continuará activa.\n\n¿Estás seguro?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Limpiar historial',
              style: 'destructive',
              onPress: async () => {
                const cleaned = await autoCleanupManager.cleanupOnRelationshipEnd(
                  userData.couple_id
                );

                if (cleaned) {
                  Alert.alert('✅ Historial limpiado', 'Todo el historial ha sido borrado');
                  resolve(true);
                } else {
                  Alert.alert('Error', 'No se pudo limpiar el historial');
                  resolve(false);
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error limpiando historial:', error);
      Alert.alert('Error', 'No se pudo limpiar el historial');
      return false;
    }
  }
}

export const relationshipService = new RelationshipService();
