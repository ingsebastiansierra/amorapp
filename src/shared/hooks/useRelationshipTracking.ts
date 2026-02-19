import { useState, useEffect } from 'react';
import { supabase } from '@/core/config/supabase';
import { SyncStats } from '@/core/types/relationship';
import { EmotionalState } from '@/core/types/emotions';

export const useRelationshipTracking = (coupleId: string | null) => {
    const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSyncId, setCurrentSyncId] = useState<string | null>(null);

    // Cargar estadísticas
    const loadSyncStats = async () => {
        if (!coupleId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .rpc('get_sync_stats', { p_couple_id: coupleId });

            if (error) throw error;

            if (data && data.length > 0) {
                setSyncStats(data[0]);
            }
        } catch (error) {
            console.error('Error loading sync stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Registrar nueva sincronización
    const recordSync = async (emotion: EmotionalState) => {
        if (!coupleId) return null;

        try {
            const { data, error } = await supabase
                .rpc('record_emotional_sync', {
                    p_couple_id: coupleId,
                    p_emotion: emotion
                });

            if (error) throw error;

            setCurrentSyncId(data);
            
            // Recargar estadísticas
            await loadSyncStats();
            
            return data;
        } catch (error) {
            console.error('Error recording sync:', error);
            return null;
        }
    };

    // Finalizar sincronización actual
    const endSync = async () => {
        if (!currentSyncId) return;

        try {
            const { error } = await supabase
                .rpc('end_emotional_sync', {
                    p_sync_id: currentSyncId
                });

            if (error) throw error;
            
            setCurrentSyncId(null);
            
            // BORRAR TODO EL HISTORIAL cuando termina la sincronía
            if (coupleId) {
                // Importar el servicio de limpieza
                const { autoCleanupManager } = await import('@/core/services/autoCleanupManager');
                await autoCleanupManager.cleanupOnRelationshipEnd(coupleId);
            }
            
            setCurrentSyncId(null);
        } catch (error) {
            console.error('Error ending sync:', error);
        }
    };

    // Establecer fecha de inicio de relación
    const setRelationshipStartDate = async (date: Date) => {
        if (!coupleId) return false;

        try {
            const { error } = await supabase
                .from('couples')
                .update({ relationship_start_date: date.toISOString().split('T')[0] })
                .eq('id', coupleId);

            if (error) throw error;

            await loadSyncStats();
            return true;
        } catch (error) {
            console.error('Error setting relationship start date:', error);
            return false;
        }
    };

    useEffect(() => {
        loadSyncStats();
    }, [coupleId]);

    return {
        syncStats,
        loading,
        recordSync,
        endSync,
        setRelationshipStartDate,
        refreshStats: loadSyncStats
    };
};
