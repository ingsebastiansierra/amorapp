// Gestor de limpieza automática
import { cleanupService } from './cleanupService';
import { supabase } from '@/core/config/supabase';

class AutoCleanupManager {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Inicia la limpieza automática periódica
   */
  start(intervalMinutes: number = 60, daysToKeep: number = 7) {
    if (this.isRunning) {
      console.log('⚠️ Limpieza automática ya está en ejecución');
      return;
    }

    console.log(`🧹 Iniciando limpieza automática (cada ${intervalMinutes} min, mantener ${daysToKeep} días)`);
    
    // Ejecutar inmediatamente
    this.performCleanup(daysToKeep);

    // Configurar intervalo
    const intervalMs = intervalMinutes * 60 * 1000;
    this.cleanupInterval = setInterval(() => {
      this.performCleanup(daysToKeep);
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Detiene la limpieza automática
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.isRunning = false;
      console.log('🛑 Limpieza automática detenida');
    }
  }

  /**
   * Ejecuta la limpieza una vez
   */
  private async performCleanup(daysToKeep: number) {
    try {
      const result = await cleanupService.cleanupOldData(
        daysToKeep,
        daysToKeep,
        daysToKeep,
        30
      );

      if (result) {
        const totalDeleted =
          result.messages_deleted +
          result.voice_notes_deleted +
          result.images_deleted;

        if (totalDeleted > 0) {
          console.log(`✅ Auto-limpieza: ${totalDeleted} elementos borrados`);
        }
      }
    } catch (error) {
      console.error('❌ Error en auto-limpieza:', error);
    }
  }

  /**
   * Limpia todo el historial de una pareja (al terminar relación)
   */
  async cleanupOnRelationshipEnd(coupleId: string) {
    try {
      console.log('🗑️ Limpiando historial de pareja...');
      const result = await cleanupService.deleteCoupleHistory(coupleId);
      
      if (result) {
        console.log('✅ Historial de pareja borrado completamente');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error limpiando historial de pareja:', error);
      return false;
    }
  }

  /**
   * Limpia datos al cerrar sesión
   */
  async cleanupOnLogout(userId: string) {
    try {
      console.log('🗑️ Limpiando datos al cerrar sesión...');
      
      // Obtener couple_id del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('couple_id')
        .eq('id', userId)
        .single();

      if (userData?.couple_id) {
        // Limpiar historial de la pareja
        await this.cleanupOnRelationshipEnd(userData.couple_id);
      }

      return true;
    } catch (error) {
      console.error('❌ Error limpiando datos al cerrar sesión:', error);
      return false;
    }
  }
}

export const autoCleanupManager = new AutoCleanupManager();
