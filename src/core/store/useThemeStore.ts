import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType, Theme } from '@/core/types/theme';
import { THEMES } from '@/core/config/themes';

interface UnlockedTheme {
  themeId: ThemeType;
  expiresAt: number;
}

interface ThemeState {
  currentTheme: ThemeType;
  theme: Theme;
  isPremium: boolean;
  unlockedThemes: UnlockedTheme[]; // Array de temas desbloqueados
  setTheme: (themeId: ThemeType) => Promise<void>;
  loadTheme: () => Promise<void>;
  setPremiumStatus: (isPremium: boolean) => void;
  unlockThemeTemporarily: (themeId: ThemeType) => Promise<void>;
  checkThemeExpiration: () => Promise<void>;
  getTimeRemaining: (themeId: ThemeType) => number | null;
  isThemeUnlocked: (themeId: ThemeType) => boolean;
}

const THEME_STORAGE_KEY = '@palpitos_theme';
const UNLOCKED_THEMES_KEY = '@palpitos_unlocked_themes';

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: 'default',
  theme: THEMES.default,
  isPremium: false,
  unlockedThemes: [],

  setTheme: async (themeId: ThemeType) => {
    const theme = THEMES[themeId];
    const state = get();
    
    // Verificar si el tema es premium
    if (theme.isPremium) {
      // Permitir si tiene premium permanente O si es uno de los temas desbloqueados temporalmente
      const canUse = state.isPremium || state.isThemeUnlocked(themeId);
      
      if (!canUse) {
        throw new Error('Este tema requiere suscripción Premium');
      }
    }

    try {
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
      
      // Actualizar estado
      set({
        currentTheme: themeId,
        theme: theme,
      });
      
      // console.log('✅ Tema cambiado a:', theme.name);
    } catch (error) {
      console.error('❌ Error guardando tema:', error);
      throw error;
    }
  },

  loadTheme: async () => {
    try {
      // Verificar si los temas desbloqueados han expirado
      await get().checkThemeExpiration();
      
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (savedTheme && THEMES[savedTheme as ThemeType]) {
        const themeId = savedTheme as ThemeType;
        const theme = THEMES[themeId];
        const state = get();
        
        // Si es premium, verificar si puede usarlo
        if (theme.isPremium) {
          const canUse = state.isPremium || state.isThemeUnlocked(themeId);
          
          if (!canUse) {
            console.log('⚠️ Tema premium sin acceso, volviendo al default');
            set({
              currentTheme: 'default',
              theme: THEMES.default,
            });
            return;
          }
        }
        
        set({
          currentTheme: themeId,
          theme: theme,
        });
        // console.log('✅ Tema cargado:', theme.name);
      }
    } catch (error) {
      console.error('❌ Error cargando tema:', error);
    }
  },

  setPremiumStatus: (isPremium: boolean) => {
    set({ isPremium });
    
    // Si pierde premium y tiene un tema premium (que no está desbloqueado), volver al default
    const state = get();
    if (!isPremium && state.theme.isPremium && !state.isThemeUnlocked(state.currentTheme)) {
      get().setTheme('default');
    }
  },

  unlockThemeTemporarily: async (themeId: ThemeType) => {
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
    
    try {
      const state = get();
      
      // Agregar o actualizar el tema en la lista de desbloqueados
      const existingIndex = state.unlockedThemes.findIndex(t => t.themeId === themeId);
      let newUnlockedThemes: UnlockedTheme[];
      
      if (existingIndex >= 0) {
        // Actualizar el tiempo de expiración si ya existe
        newUnlockedThemes = [...state.unlockedThemes];
        newUnlockedThemes[existingIndex] = { themeId, expiresAt };
      } else {
        // Agregar nuevo tema desbloqueado
        newUnlockedThemes = [...state.unlockedThemes, { themeId, expiresAt }];
      }
      
      await AsyncStorage.setItem(UNLOCKED_THEMES_KEY, JSON.stringify(newUnlockedThemes));
      
      set({ unlockedThemes: newUnlockedThemes });
      
      // console.log(`✅ Tema "${THEMES[themeId].name}" desbloqueado por 24 horas`);
    } catch (error) {
      console.error('❌ Error desbloqueando tema:', error);
    }
  },

  checkThemeExpiration: async () => {
    try {
      const unlockedThemesStr = await AsyncStorage.getItem(UNLOCKED_THEMES_KEY);
      
      if (unlockedThemesStr) {
        const unlockedThemes: UnlockedTheme[] = JSON.parse(unlockedThemesStr);
        const now = Date.now();
        
        // Filtrar solo los temas que no han expirado
        const validThemes = unlockedThemes.filter(t => t.expiresAt > now);
        
        // Si hay temas que expiraron, actualizar el storage
        if (validThemes.length !== unlockedThemes.length) {
          await AsyncStorage.setItem(UNLOCKED_THEMES_KEY, JSON.stringify(validThemes));
          
          const expiredThemes = unlockedThemes.filter(t => t.expiresAt <= now);
          expiredThemes.forEach(t => {
            console.log(`⏰ Tema "${THEMES[t.themeId].name}" expirado`);
          });
          
          // Si está usando un tema expirado, volver al default
          const state = get();
          const currentThemeExpired = expiredThemes.some(t => t.themeId === state.currentTheme);
          if (currentThemeExpired && !state.isPremium) {
            await get().setTheme('default');
          }
        }
        
        set({ unlockedThemes: validThemes });
        
        validThemes.forEach(t => {
          // console.log(`✅ Tema "${THEMES[t.themeId].name}" desbloqueado hasta`, new Date(t.expiresAt).toLocaleString());
        });
      }
    } catch (error) {
      console.error('❌ Error verificando expiración de temas:', error);
    }
  },

  getTimeRemaining: (themeId: ThemeType) => {
    const state = get();
    const unlockedTheme = state.unlockedThemes.find(t => t.themeId === themeId);
    
    if (!unlockedTheme) return null;
    
    const remaining = unlockedTheme.expiresAt - Date.now();
    return remaining > 0 ? remaining : null;
  },

  isThemeUnlocked: (themeId: ThemeType) => {
    const state = get();
    return state.unlockedThemes.some(t => t.themeId === themeId && t.expiresAt > Date.now());
  },
}));
