import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MessageColorTheme = 'classic-pink' | 'ocean-blue' | 'midnight-purple' | 'soft-green';
export type EmojiStyle = 'modern' | 'classic' | 'minimal';

interface ChatBackgroundState {
  backgroundImage: string | null;
  backgroundOpacity: number;
  messageColorTheme: MessageColorTheme;
  emojiStyle: EmojiStyle;
  setBackgroundImage: (uri: string | null) => Promise<void>;
  setBackgroundOpacity: (opacity: number) => Promise<void>;
  setMessageColorTheme: (theme: MessageColorTheme) => Promise<void>;
  setEmojiStyle: (style: EmojiStyle) => Promise<void>;
  loadBackground: () => Promise<void>;
  clearBackground: () => Promise<void>;
}

const BACKGROUND_STORAGE_KEY = '@palpitos_chat_background';
const OPACITY_STORAGE_KEY = '@palpitos_chat_opacity';
const MESSAGE_COLOR_THEME_KEY = '@palpitos_message_color_theme';
const EMOJI_STYLE_KEY = '@palpitos_emoji_style';

export const useChatBackgroundStore = create<ChatBackgroundState>((set) => ({
  backgroundImage: null,
  backgroundOpacity: 0.5,
  messageColorTheme: 'classic-pink',
  emojiStyle: 'modern',

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

  setMessageColorTheme: async (theme: MessageColorTheme) => {
    try {
      await AsyncStorage.setItem(MESSAGE_COLOR_THEME_KEY, theme);
      set({ messageColorTheme: theme });
      console.log('✅ Tema de color guardado:', theme);
    } catch (error) {
      console.error('❌ Error guardando tema de color:', error);
    }
  },

  setEmojiStyle: async (style: EmojiStyle) => {
    try {
      await AsyncStorage.setItem(EMOJI_STYLE_KEY, style);
      set({ emojiStyle: style });
      console.log('✅ Estilo de emoji guardado:', style);
    } catch (error) {
      console.error('❌ Error guardando estilo de emoji:', error);
    }
  },

  loadBackground: async () => {
    try {
      const [uri, opacity, colorTheme, emojiStyle] = await Promise.all([
        AsyncStorage.getItem(BACKGROUND_STORAGE_KEY),
        AsyncStorage.getItem(OPACITY_STORAGE_KEY),
        AsyncStorage.getItem(MESSAGE_COLOR_THEME_KEY),
        AsyncStorage.getItem(EMOJI_STYLE_KEY),
      ]);

      set({
        backgroundImage: uri,
        backgroundOpacity: opacity ? parseFloat(opacity) : 0.5,
        messageColorTheme: (colorTheme as MessageColorTheme) || 'classic-pink',
        emojiStyle: (emojiStyle as EmojiStyle) || 'modern',
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
