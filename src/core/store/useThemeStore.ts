import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType, Theme } from '@/core/types/theme';
import { THEMES } from '@/core/config/themes';

interface ThemeState {
  currentTheme: ThemeType;
  theme: Theme;
  isPremium: boolean;
  setTheme: (themeId: ThemeType) => Promise<void>;
  loadTheme: () => Promise<void>;
  setPremiumStatus: (isPremium: boolean) => void;
}

const THEME_STORAGE_KEY = '@palpitos_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: 'default',
  theme: THEMES.default,
  isPremium: false,

  setTheme: async (themeId: ThemeType) => {
    const theme = THEMES[themeId];
    
    // Verificar si el tema es premium y el usuario no tiene premium
    if (theme.isPremium && !get().isPremium) {
      throw new Error('Este tema requiere suscripción Premium');
    }

    try {
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
      
      // Actualizar estado
      set({
        currentTheme: themeId,
        theme: theme,
      });
      
      console.log('✅ Tema cambiado a:', theme.name);
    } catch (error) {
      console.error('❌ Error guardando tema:', error);
      throw error;
    }
  },

  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (savedTheme && THEMES[savedTheme as ThemeType]) {
        const themeId = savedTheme as ThemeType;
        const theme = THEMES[themeId];
        
        // Si es premium y el usuario no tiene premium, volver al default
        if (theme.isPremium && !get().isPremium) {
          console.log('⚠️ Tema premium sin suscripción, volviendo al default');
          set({
            currentTheme: 'default',
            theme: THEMES.default,
          });
        } else {
          set({
            currentTheme: themeId,
            theme: theme,
          });
          console.log('✅ Tema cargado:', theme.name);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando tema:', error);
    }
  },

  setPremiumStatus: (isPremium: boolean) => {
    set({ isPremium });
    
    // Si pierde premium y tiene un tema premium, volver al default
    if (!isPremium && get().theme.isPremium) {
      get().setTheme('default');
    }
  },
}));
