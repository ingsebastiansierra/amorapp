// Sistema de tipografía de la app usando fuentes del sistema
export const typography = {
  // Familias de fuentes (usando fuentes del sistema)
  fonts: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    heading: 'System',
    headingBold: 'System',
  },

  // Tamaños de fuente
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },

  // Pesos de fuente
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Estilos de texto predefinidos
export const textStyles = {
  // Headings
  h1: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes['4xl'] * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.semiBold,
    lineHeight: typography.sizes['2xl'] * typography.lineHeights.normal,
  },
  h4: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semiBold,
    lineHeight: typography.sizes.xl * typography.lineHeights.normal,
  },

  // Body text
  body: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  bodyMedium: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  bodySemiBold: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semiBold,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },

  // Small text
  small: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  smallMedium: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },

  // Tiny text
  tiny: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    lineHeight: typography.sizes.xs * typography.lineHeights.normal,
  },
  tinyBold: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.xs * typography.lineHeights.normal,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },

  // Buttons
  button: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semiBold,
    letterSpacing: typography.letterSpacing.normal,
  },
  buttonLarge: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semiBold,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Labels
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    letterSpacing: typography.letterSpacing.normal,
  },
  labelBold: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
};
