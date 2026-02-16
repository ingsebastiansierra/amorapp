// Hook para manejar notas de voz
import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useVoiceStore } from '@/core/store/useVoiceStore';
import { voiceService } from '@/core/services/voiceService';
import { useAuthStore } from '@/core/store/useAuthStore';
import { SendVoiceNoteOptions } from '@/core/types/voice';

export function useVoiceNotes() {
  const user = useAuthStore((state) => state.user);
  const {
    pendingNotes,
    isLoading,
    currentlyPlaying,
    setPendingNotes,
    addPendingNote,
    removeNote,
    setLoading,
    setCurrentlyPlaying,
  } = useVoiceStore();

  // Cargar notas pendientes al montar
  useEffect(() => {
    if (user?.id) {
      loadPendingNotes();
    }
  }, [user?.id]);

  // Suscribirse a nuevas notas en tiempo real
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = voiceService.subscribeToNewVoiceNotes(user.id, (newNote) => {
      addPendingNote(newNote);
      
      // Mostrar notificación
      Alert.alert(
        '🎤 Nueva nota de voz',
        'Tu pareja te envió una nota de voz',
        [{ text: 'Ver después' }, { text: 'Escuchar ahora', onPress: () => {} }]
      );
    });

    return unsubscribe;
  }, [user?.id]);

  const loadPendingNotes = useCallback(async () => {
    try {
      setLoading(true);
      const notes = await voiceService.getPendingVoiceNotes();
      setPendingNotes(notes);
    } catch (error) {
      console.error('Error loading voice notes:', error);
      Alert.alert('Error', 'No se pudieron cargar las notas de voz');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVoiceNote = useCallback(
    async (toUserId: string, audioUri: string, duration: number, options?: SendVoiceNoteOptions) => {
      try {
        setLoading(true);
        await voiceService.sendVoiceNote(toUserId, audioUri, duration, options);
        Alert.alert('✅ Enviado', 'Nota de voz enviada correctamente');
      } catch (error) {
        console.error('Error sending voice note:', error);
        Alert.alert('Error', 'No se pudo enviar la nota de voz');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const playVoiceNote = useCallback(async (noteId: string, storagePath: string) => {
    try {
      setCurrentlyPlaying(noteId);
      
      // Obtener URL firmada
      const url = await voiceService.getVoiceNoteUrl(storagePath);
      
      // Reproducir
      const sound = await voiceService.playVoiceNote(url);
      
      let hasFinished = false;
      
      // Cuando termine de reproducir, marcar como escuchada
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish && !hasFinished) {
          hasFinished = true;
          
          try {
            console.log('🎵 Audio terminó de reproducirse');
            setCurrentlyPlaying(null);
            
            // Descargar el sonido primero
            await sound.unloadAsync();
            
            // Marcar como escuchada (se autodestruye en BD)
            console.log('📝 Marcando como escuchada...');
            await voiceService.markAsListened(noteId);
            
            // Eliminar de storage
            console.log('🗑️ Eliminando de storage...');
            await voiceService.deleteVoiceNote(noteId, storagePath);
            
            // Remover de la lista
            removeNote(noteId);
            
            Alert.alert(
              '🔥 Nota autodestruida',
              'La nota de voz se ha eliminado después de escucharla'
            );
          } catch (error) {
            console.error('❌ Error auto-deleting voice note:', error);
            // Aún así remover de la lista local
            removeNote(noteId);
          }
        }
      });
      
      return sound;
    } catch (error) {
      console.error('Error playing voice note:', error);
      setCurrentlyPlaying(null);
      Alert.alert('Error', 'No se pudo reproducir la nota de voz');
      throw error;
    }
  }, []);

  const deleteVoiceNote = useCallback(async (noteId: string, storagePath: string) => {
    try {
      await voiceService.deleteVoiceNote(noteId, storagePath);
      removeNote(noteId);
      Alert.alert('✅ Eliminado', 'Nota de voz eliminada correctamente');
    } catch (error) {
      console.error('Error deleting voice note:', error);
      Alert.alert('Error', 'No se pudo eliminar la nota de voz');
      throw error;
    }
  }, []);

  return {
    pendingNotes,
    isLoading,
    currentlyPlaying,
    loadPendingNotes,
    sendVoiceNote,
    playVoiceNote,
    deleteVoiceNote,
  };
}
