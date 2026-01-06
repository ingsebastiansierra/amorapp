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

let pollingInterval: NodeJS.Timeout | null = null;

export const useEmotionalStore = create<EmotionalStore>((set, get) => ({
  myState: null,
  partnerState: null,

  setMyState: async (state: EmotionalState, intensity: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('emotional_states').insert({
      user_id: user.id,
      state,
      intensity,
    });

    set({ myState: state });
  },

  fetchPartnerState: async (partnerId: string) => {
    console.log('Fetching partner state for:', partnerId);
    const { data, error } = await supabase
      .from('emotional_states')
      .select('state')
      .eq('user_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Partner state data:', data, 'Error:', error);

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
