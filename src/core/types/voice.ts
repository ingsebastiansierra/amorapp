// Tipos para notas de voz efímeras

export interface VoiceNote {
  id: string;
  from_user_id: string;
  to_user_id: string;
  storage_path: string;
  duration: number; // en segundos
  waveform_data?: number[]; // array de amplitudes para visualización
  listened: boolean;
  listened_at?: string;
  is_expired: boolean;
  created_at: string;
  expires_at: string;
}

export interface RecordVoiceNoteOptions {
  maxDuration?: number; // máximo 30 segundos
}

export interface SendVoiceNoteOptions {
  waveformData?: number[];
}

export interface VoiceNoteResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  uri?: string;
  waveform: number[];
}
