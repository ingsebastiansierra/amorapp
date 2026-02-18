// Tipos de temas disponibles
export type ThemeType = 
  | 'default'      // Rosa/Morado (original)
  | 'sunset'       // Naranja/Rosa
  | 'ocean'        // Azul/Turquesa
  | 'forest'       // Verde/Esmeralda
  | 'lavender'     // Lavanda/Púrpura
  | 'trap'         // Trap/Urbano (Regalo)
  | 'cherry'       // Rojo/Rosa (Premium)
  | 'midnight'     // Azul oscuro/Negro (Premium)
  | 'peach'        // Durazno/Coral (Premium)
  | 'galaxy'       // Espacio/Estrellas (Premium)
  | 'aurora'       // Aurora boreal (Premium)
  | 'sakura'       // Flores de cerezo (Premium)
  | 'neon'         // Neón/Cyberpunk (Premium)
  | 'desert';      // Desierto/Atardecer (Premium)

// Definición de colores de un tema
export interface ThemeColors {
  // Colores principales
  primary: string;
  secondary: string;
  accent: string;
  
  // Gradientes
  gradientStart: string;
  gradientEnd: string;
  
  // Backgrounds
  background: string;
  cardBackground: string;
  
  // Textos
  text: string;
  textSecondary: string;
  textLight: string;
  
  // Estados
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Específicos de la app
  heartColor: string;
  syncColor: string;
  
  // Chat
  chatBackground?: string;
  messageBackground?: string;
  messageBubbleOwn?: string;
  messageBubblePartner?: string;
}

// Tema completo
export interface Theme {
  id: ThemeType;
  name: string;
  emoji: string;
  colors: ThemeColors;
  isPremium: boolean;
  description: string;
  chatBackgroundPattern?: 'dots' | 'hearts' | 'stars' | 'waves' | 'gradient' | 'none';
}
