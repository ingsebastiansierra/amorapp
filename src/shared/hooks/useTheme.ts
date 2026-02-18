import { useThemeStore } from '@/core/store/useThemeStore';
import { ThemeColors } from '@/core/types/theme';

/**
 * Hook para acceder fácilmente a los colores del tema actual
 * 
 * @example
 * const { colors, theme } = useTheme();
 * <View style={{ backgroundColor: colors.primary }} />
 */
export const useTheme = () => {
  const { theme, currentTheme, setTheme, isPremium } = useThemeStore();

  return {
    colors: theme.colors,
    theme: theme,
    themeId: currentTheme,
    setTheme,
    isPremium,
  };
};

/**
 * Hook para obtener solo los colores del tema
 * 
 * @example
 * const colors = useThemeColors();
 * <Text style={{ color: colors.text }}>Hola</Text>
 */
export const useThemeColors = (): ThemeColors => {
  const { theme } = useThemeStore();
  return theme.colors;
};
