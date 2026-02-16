// Servicio para manejar notas de voz efímeras
import { supabase } from '../config/supabase';
import { VoiceNote, SendVoiceNoteOptions, VoiceNoteResult } from '../types/voice';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

class VoiceService {
  private readonly BUCKET_NAME = 'voice-notes';
  private recording: Audio.Recording | null = null;

  /**
   * Solicitar permisos de micrófono
   */
  async requestPermissions() {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Iniciar grabación
   */
  async startRecording(): Promise<Audio.Recording> {
    try {
      // Limpiar cualquier grabación anterior
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e) {
          // Ignorar errores de limpieza
        }
        this.recording = null;
      }

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Crear y configurar grabación
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      return recording;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Detener grabación
   */
  async stopRecording(): Promise<{ uri: string; duration: number }> {
    if (!this.recording) {
      throw new Error('No hay grabación activa');
    }

    try {
      // Obtener status ANTES de detener
      const status = await this.recording.getStatusAsync();
      
      // Detener y descargar
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      // Limpiar referencia
      this.recording = null;

      if (!uri) {
        throw new Error('No se pudo obtener URI de la grabación');
      }

      // Duración en segundos
      const duration = status.isLoaded ? Math.floor(status.durationMillis / 1000) : 0;

      return { uri, duration };
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.recording = null; // Limpiar en caso de error
      throw error;
    }
  }

  /**
   * Cancelar grabación
   */
  async cancelRecording() {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error canceling recording:', error);
      } finally {
        this.recording = null;
      }
    }
  }

  /**
   * Enviar nota de voz
   */
  async sendVoiceNote(
    toUserId: string,
    audioUri: string,
    duration: number,
    options: SendVoiceNoteOptions = {}
  ): Promise<VoiceNote> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    if (duration > 30) {
      throw new Error('La nota de voz no puede durar más de 30 segundos');
    }

    try {
      // 1. Leer el archivo como base64
      const base64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 2. Convertir base64 a ArrayBuffer
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 3. Generar nombre único
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.m4a`;
      const filePath = `${user.id}/${fileName}`;

      // 4. Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, bytes.buffer, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 5. Crear registro en la base de datos
      const { data, error } = await supabase
        .from('voice_notes')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          storage_path: filePath,
          duration,
          waveform_data: options.waveformData || null,
        })
        .select()
        .single();

      if (error) throw error;

      return data as VoiceNote;
    } catch (error) {
      console.error('Error sending voice note:', error);
      throw error;
    }
  }

  /**
   * Obtener notas de voz pendientes
   */
  async getPendingVoiceNotes(): Promise<VoiceNote[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('voice_notes')
      .select('*')
      .eq('to_user_id', user.id)
      .eq('is_expired', false)
      .eq('listened', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data as VoiceNote[]) || [];
  }

  /**
   * Obtener URL firmada de una nota de voz
   */
  async getVoiceNoteUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(storagePath, 60); // URL válida por 60 segundos

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('No se pudo obtener URL');

    return data.signedUrl;
  }

  /**
   * Marcar nota como escuchada (se autodestruye)
   */
  async markAsListened(noteId: string): Promise<VoiceNoteResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase.rpc('mark_voice_note_listened', {
      note_id: noteId,
      listener_id: user.id,
    });

    if (error) throw error;

    return data as VoiceNoteResult;
  }

  /**
   * Eliminar nota de voz
   */
  async deleteVoiceNote(noteId: string, storagePath: string): Promise<void> {
    try {
      console.log('🗑️ Intentando eliminar nota de voz:', { noteId, storagePath });

      // 1. Eliminar de storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([storagePath]);

      if (storageError) {
        console.error('❌ Error eliminando de storage:', storageError);
        throw storageError;
      }

      console.log('✅ Archivo eliminado de storage');

      // 2. Eliminar registro de BD
      const { error: dbError } = await supabase
        .from('voice_notes')
        .delete()
        .eq('id', noteId);

      if (dbError) {
        console.error('❌ Error eliminando de BD:', dbError);
        throw dbError;
      }

      console.log('✅ Registro eliminado de BD');
    } catch (error) {
      console.error('❌ Error en deleteVoiceNote:', error);
      throw error;
    }
  }

  /**
   * Reproducir nota de voz
   */
  async playVoiceNote(url: string): Promise<Audio.Sound> {
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    );

    return sound;
  }

  /**
   * Suscribirse a nuevas notas de voz en tiempo real
   */
  subscribeToNewVoiceNotes(userId: string, callback: (note: VoiceNote) => void) {
    const channel = supabase
      .channel('voice-notes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_notes',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as VoiceNote);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}

export const voiceService = new VoiceService();
