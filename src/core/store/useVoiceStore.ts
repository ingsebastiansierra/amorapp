// Store para manejar notas de voz
import { create } from 'zustand';
import { VoiceNote } from '../types/voice';

interface VoiceState {
  pendingNotes: VoiceNote[];
  isLoading: boolean;
  currentlyPlaying: string | null; // ID de la nota que se está reproduciendo
  
  setPendingNotes: (notes: VoiceNote[]) => void;
  addPendingNote: (note: VoiceNote) => void;
  removeNote: (noteId: string) => void;
  setLoading: (loading: boolean) => void;
  setCurrentlyPlaying: (noteId: string | null) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  pendingNotes: [],
  isLoading: false,
  currentlyPlaying: null,

  setPendingNotes: (notes) => set({ pendingNotes: notes }),
  
  addPendingNote: (note) =>
    set((state) => ({
      pendingNotes: [note, ...state.pendingNotes],
    })),
  
  removeNote: (noteId) =>
    set((state) => ({
      pendingNotes: state.pendingNotes.filter((n) => n.id !== noteId),
    })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setCurrentlyPlaying: (noteId) => set({ currentlyPlaying: noteId }),
}));
