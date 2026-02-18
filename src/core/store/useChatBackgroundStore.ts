import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatBackgroundState {
  backgroundImage: string | null;
  backgroundOpacity: number;
  setBackgroundImage: (uri: string | null) => Promise<void>;
  setBackgroundOpacity: (opacity: number) => Promise<void>;
  loadBackground: () => Promise<void>;
  clearBackground: () => Promise<void>;
}

const BACKGROUND_STORAGE_KEY = '@palpitos_chat_background';
const OPACITY_STORAGE_KEY = '@palpitos_chat_opacity';

export const useChatBackgroundStore = create<ChatBackgroundState>((set) => ({
  backgroundImage: null,
  backgroundOpacity: 0.5,

  setBackgroundImage: async (uri: string | null) => {
    try {
      if (uri) {
        await AsyncStorage.setItem(BACKGROUND_STORAGE_KEY, uri);
      } else {
        await AsyncStorage.removeItem(BACKGROUND_STORAGE_KEY);
      }
      set({ backgroundImage: uri });
      console.log('✅ Fondo de chat guardado');
    } catch (error) {
      console.error('❌ Error guardando fondo:', error);
    }
  },

  setBackgroundOpacity: async (opacity: number) => {
    try {
      await AsyncStorage.setItem(OPACITY_STORAGE_KEY, opacity.toString());
      set({ backgroundOpacity: opacity });
    } catch (error) {
      console.error('❌ Error guardando opacidad:', error);
    }
  },

  loadBackground: async () => {
    try {
      const [uri, opacity] = await Promise.all([
        AsyncStorage.getItem(BACKGROUND_STORAGE_KEY),
        AsyncStorage.getItem(OPACITY_STORAGE_KEY),
      ]);

      set({
        backgroundImage: uri,
        backgroundOpacity: opacity ? parseFloat(opacity) : 0.5,
      });
    } catch (error) {
      console.error('❌ Error cargando fondo:', error);
    }
  },

  clearBackground: async () => {
    try {
      await AsyncStorage.removeItem(BACKGROUND_STORAGE_KEY);
      set({ backgroundImage: null });
      console.log('✅ Fondo de chat eliminado');
    } catch (error) {
      console.error('❌ Error eliminando fondo:', error);
    }
  },
}));
