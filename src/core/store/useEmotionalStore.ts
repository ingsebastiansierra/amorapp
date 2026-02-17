import { create } from 'zustand';
import { supabase } from '@core/config/supabase';
import { EmotionalState } from '@core/types/emotions';

interface EmotionalStore {
  myState: EmotionalState | null;
  partnerState: EmotionalState | null;
  setMyState: (state: EmotionalState, intensity: number) => Promise<void>;
  fetchPartnerState: (partnerId: string) => Promise<void>;
  startPolling: (partnerId: string) => void;
  stopPolling: () => void;
}

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export const useEmotionalStore = create<EmotionalStore>((set, get) => ({
  myState: null,
  partnerState: null,

  setMyState: async (state: EmotionalState, intensity: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Obtener el estado anterior y el de la pareja
    const previousState = get().myState;
    const partnerState = get().partnerState;

    await supabase.from('emotional_states').insert({
      user_id: user.id,
      state,
      intensity,
    });

    set({ myState: state });

    // Detectar si se rompió la sincronía
    if (previousState && partnerState && previousState === partnerState && state !== partnerState) {
      console.log('💔 Sincronía rota - Borrando historial...');
      
      // Obtener couple_id
      const { data: userData } = await supabase
        .from('users')
        .select('couple_id')
        .eq('id', user.id)
        .single();

      if (userData?.couple_id) {
        // Borrar todo el historial
        const { autoCleanupManager } = await import('@/core/services/autoCleanupManager');
        await autoCleanupManager.cleanupOnRelationshipEnd(userData.couple_id);
        console.log('✅ Historial borrado al romper sincronía');
      }
    }
  },

  fetchPartnerState: async (partnerId: string) => {
    const { data, error } = await supabase
      .from('emotional_states')
      .select('state')
      .eq('user_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      set({ partnerState: data.state as EmotionalState });
    } else {
      set({ partnerState: null });
    }
  },

  startPolling: (partnerId: string) => {
    // Fetch inicial
    get().fetchPartnerState(partnerId);
    
    // Polling cada 5 segundos
    pollingInterval = setInterval(() => {
      get().fetchPartnerState(partnerId);
    }, 5000);
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  },
}));
