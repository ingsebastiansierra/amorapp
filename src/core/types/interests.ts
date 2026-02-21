// ============================================
// TIPOS: Sistema de Intereses y Perfiles
// ============================================

export type IntentionType = 
  | 'make_friends'      // Hacer amigos
  | 'dating'            // Citas románticas
  | 'casual'            // Algo casual
  | 'activity_partner'  // Compañero de actividades
  | 'just_talk';        // Solo platicar

export type ActivityType =
  | 'coffee' | 'drinks' | 'dinner'
  | 'movies' | 'concert' | 'club'
  | 'gym' | 'run' | 'hike' | 'walk'
  | 'videogames' | 'study' | 'work'
  | 'museum' | 'shopping' | 'beach' | 'park'
  | 'other';

export type AvailabilityType =
  | 'now'           // Disponible ahora
  | 'today'         // Hoy
  | 'this_week'     // Esta semana
  | 'flexible';     // Flexible

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type CookingSkill =
  | 'none'
  | 'basic'
  | 'intermediate'
  | 'expert';

export type CircadianRhythm =
  | 'night_owl'
  | 'early_bird'
  | 'flexible';

export type TravelFrequency =
  | 'never'
  | 'rarely'
  | 'sometimes'
  | 'often'
  | 'always';

export type RelationshipGoal =
  | 'casual'
  | 'serious'
  | 'marriage'
  | 'unsure';

export type DrinkingHabit =
  | 'never'
  | 'socially'
  | 'regularly';

export type WantsKids = 'yes' | 'no' | 'maybe';

// ============================================
// INTERFACES
// ============================================

export interface UserIntention {
  id: string;
  user_id: string;
  intention_type: IntentionType;
  activity?: ActivityType;
  availability: AvailabilityType;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface MusicInterests {
  favorite_artist?: string;
  favorite_song?: string;
  genres: string[];
}

export interface EntertainmentInterests {
  favorite_movie?: string;
  favorite_series?: string;
  favorite_book?: string;
  hobbies: string[];
}

export interface SportsInterests {
  favorite_sport?: string;
  favorite_team?: string;
  activity_level?: ActivityLevel;
  workout_preferences: string[];
}

export interface FoodInterests {
  favorite_food?: string;
  favorite_restaurant?: string;
  dietary: string[];
  cooking_skill?: CookingSkill;
}

export interface LifestyleInterests {
  favorite_color?: string;
  personality_type?: string; // MBTI
  zodiac_sign?: string;
  love_language?: string;
  rhythm?: CircadianRhythm;
}

export interface TravelInterests {
  favorite_place?: string;
  dream_destination?: string;
  travel_frequency?: TravelFrequency;
}

export interface ValuesInterests {
  relationship_goal?: RelationshipGoal;
  has_kids: boolean;
  wants_kids?: WantsKids;
  drinks?: DrinkingHabit;
  smokes: boolean;
  pets: string[];
}

export interface UserInterests {
  id: string;
  user_id: string;
  
  // Música
  music_favorite_artist?: string;
  music_favorite_song?: string;
  music_genres: string[];
  
  // Entretenimiento
  entertainment_favorite_movie?: string;
  entertainment_favorite_series?: string;
  entertainment_favorite_book?: string;
  entertainment_hobbies: string[];
  
  // Deportes
  sports_favorite_sport?: string;
  sports_favorite_team?: string;
  sports_activity_level?: ActivityLevel;
  sports_workout_preferences: string[];
  
  // Comida
  food_favorite_food?: string;
  food_favorite_restaurant?: string;
  food_dietary: string[];
  food_cooking_skill?: CookingSkill;
  
  // Estilo de vida
  lifestyle_favorite_color?: string;
  lifestyle_personality_type?: string;
  lifestyle_zodiac_sign?: string;
  lifestyle_love_language?: string;
  lifestyle_rhythm?: CircadianRhythm;
  
  // Viajes
  travel_favorite_place?: string;
  travel_dream_destination?: string;
  travel_frequency?: TravelFrequency;
  
  // Valores
  values_relationship_goal?: RelationshipGoal;
  values_has_kids: boolean;
  values_wants_kids?: WantsKids;
  values_drinks?: DrinkingHabit;
  values_smokes: boolean;
  values_pets: string[];
  
  // Metadata
  profile_completed: boolean;
  updated_at: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Preferencias de búsqueda
  looking_for_gender: 'male' | 'female' | 'any';
  age_range_min: number;
  age_range_max: number;
  distance_max_km: number;
  
  // Deal breakers y must-haves
  deal_breakers: string[];
  must_haves: string[];
  
  // Privacidad
  show_location: boolean;
  show_last_seen: boolean;
  show_emotion_history: boolean;
  show_age: boolean;
  
  // Notificaciones
  notifications_new_matches: boolean;
  notifications_messages: boolean;
  notifications_syncs: boolean;
  
  // Metadata
  updated_at: string;
  created_at: string;
}

// ============================================
// CONFIGURACIONES DE INTENCIONES
// ============================================

export interface IntentionConfig {
  emoji: string;
  label: string;
  description: string;
  color: string;
}

export const INTENTIONS: Record<IntentionType, IntentionConfig> = {
  make_friends: {
    emoji: '👋',
    label: 'Hacer Amigos',
    description: 'Conocer gente sin presión',
    color: '#3498DB',
  },
  dating: {
    emoji: '💕',
    label: 'Citas Románticas',
    description: 'Busco algo especial',
    color: '#E91E63',
  },
  casual: {
    emoji: '🔥',
    label: 'Algo Casual',
    description: 'Diversión sin compromisos',
    color: '#FF5722',
  },
  activity_partner: {
    emoji: '🎯',
    label: 'Compañero de Actividad',
    description: 'Alguien para hacer X actividad',
    color: '#9C27B0',
  },
  just_talk: {
    emoji: '💬',
    label: 'Solo Platicar',
    description: 'Conversación interesante',
    color: '#00BCD4',
  },
};

// ============================================
// CONFIGURACIONES DE ACTIVIDADES
// ============================================

export interface ActivityConfig {
  emoji: string;
  label: string;
  category: 'food' | 'entertainment' | 'sports' | 'culture' | 'casual' | 'gaming' | 'productive';
  duration: string;
  vibe: 'casual' | 'social' | 'romantic' | 'chill' | 'energetic' | 'party' | 'active' | 'adventure' | 'intellectual' | 'indoor' | 'focused' | 'professional';
}

export const ACTIVITIES: Record<ActivityType, ActivityConfig> = {
  coffee: {
    emoji: '☕',
    label: 'Café',
    category: 'food',
    duration: '30min - 1h',
    vibe: 'casual',
  },
  drinks: {
    emoji: '🍹',
    label: 'Drinks',
    category: 'food',
    duration: '1-2h',
    vibe: 'social',
  },
  dinner: {
    emoji: '🍽️',
    label: 'Cena',
    category: 'food',
    duration: '1-2h',
    vibe: 'romantic',
  },
  movies: {
    emoji: '🎬',
    label: 'Cine',
    category: 'entertainment',
    duration: '2-3h',
    vibe: 'chill',
  },
  concert: {
    emoji: '🎵',
    label: 'Concierto',
    category: 'entertainment',
    duration: '3-4h',
    vibe: 'energetic',
  },
  club: {
    emoji: '💃',
    label: 'Antro',
    category: 'entertainment',
    duration: '3-5h',
    vibe: 'party',
  },
  gym: {
    emoji: '💪',
    label: 'Gym',
    category: 'sports',
    duration: '1-2h',
    vibe: 'active',
  },
  run: {
    emoji: '🏃',
    label: 'Correr',
    category: 'sports',
    duration: '30min - 1h',
    vibe: 'active',
  },
  hike: {
    emoji: '🥾',
    label: 'Hiking',
    category: 'sports',
    duration: '2-4h',
    vibe: 'adventure',
  },
  walk: {
    emoji: '🚶',
    label: 'Caminar',
    category: 'casual',
    duration: '30min - 1h',
    vibe: 'chill',
  },
  videogames: {
    emoji: '🎮',
    label: 'Videojuegos',
    category: 'gaming',
    duration: '1-3h',
    vibe: 'indoor',
  },
  study: {
    emoji: '📚',
    label: 'Estudiar',
    category: 'productive',
    duration: '1-3h',
    vibe: 'focused',
  },
  work: {
    emoji: '💼',
    label: 'Coworking',
    category: 'productive',
    duration: '2-4h',
    vibe: 'professional',
  },
  museum: {
    emoji: '🎨',
    label: 'Museo',
    category: 'culture',
    duration: '1-2h',
    vibe: 'intellectual',
  },
  shopping: {
    emoji: '🛍️',
    label: 'Shopping',
    category: 'casual',
    duration: '1-3h',
    vibe: 'casual',
  },
  beach: {
    emoji: '🏖️',
    label: 'Playa',
    category: 'casual',
    duration: '3-5h',
    vibe: 'chill',
  },
  park: {
    emoji: '🌳',
    label: 'Parque',
    category: 'casual',
    duration: '1-2h',
    vibe: 'chill',
  },
  other: {
    emoji: '✨',
    label: 'Otro',
    category: 'casual',
    duration: 'Variable',
    vibe: 'casual',
  },
};

// ============================================
// OPCIONES PREDEFINIDAS
// ============================================

export const MUSIC_GENRES = [
  'Reggaeton', 'Pop', 'Rock', 'Electrónica', 'Hip Hop', 'Indie',
  'Salsa', 'Banda', 'Jazz', 'Clásica', 'Metal', 'Country',
  'R&B', 'Trap', 'Cumbia', 'Bachata', 'Merengue', 'Otro',
];

export const HOBBIES = [
  'Fotografía', 'Gaming', 'Cocinar', 'Arte', 'Leer', 'Escribir',
  'Música', 'Teatro', 'Baile', 'Cine', 'Series', 'Anime',
  'Manualidades', 'Jardinería', 'Tecnología', 'Otro',
];

export const SPORTS = [
  'Fútbol', 'Basketball', 'Tenis', 'Volleyball', 'Natación',
  'Ciclismo', 'Running', 'Gym', 'Yoga', 'Pilates', 'Box',
  'Artes Marciales', 'Escalada', 'Surf', 'Skate', 'Otro',
];

export const FOODS = [
  'Pizza', 'Sushi', 'Tacos', 'Hamburguesas', 'Pasta', 'Mariscos',
  'Comida China', 'Comida Japonesa', 'Comida Italiana', 'Comida Mexicana',
  'BBQ', 'Vegetariana', 'Vegana', 'Otro',
];

export const DIETARY_OPTIONS = [
  'Omnívoro', 'Vegetariano', 'Vegano', 'Pescetariano',
  'Sin Gluten', 'Sin Lactosa', 'Kosher', 'Halal',
];

export const COLORS = [
  { name: 'Rojo', hex: '#FF0000', emoji: '🔴' },
  { name: 'Naranja', hex: '#FFA500', emoji: '🟠' },
  { name: 'Amarillo', hex: '#FFFF00', emoji: '🟡' },
  { name: 'Verde', hex: '#00FF00', emoji: '🟢' },
  { name: 'Azul', hex: '#0000FF', emoji: '🔵' },
  { name: 'Morado', hex: '#800080', emoji: '🟣' },
  { name: 'Rosa', hex: '#FFC0CB', emoji: '🩷' },
  { name: 'Negro', hex: '#000000', emoji: '⚫' },
  { name: 'Blanco', hex: '#FFFFFF', emoji: '⚪' },
  { name: 'Café', hex: '#8B4513', emoji: '🟤' },
];

export const ZODIAC_SIGNS = [
  { name: 'Aries', emoji: '♈', dates: 'Mar 21 - Abr 19' },
  { name: 'Tauro', emoji: '♉', dates: 'Abr 20 - May 20' },
  { name: 'Géminis', emoji: '♊', dates: 'May 21 - Jun 20' },
  { name: 'Cáncer', emoji: '♋', dates: 'Jun 21 - Jul 22' },
  { name: 'Leo', emoji: '♌', dates: 'Jul 23 - Ago 22' },
  { name: 'Virgo', emoji: '♍', dates: 'Ago 23 - Sep 22' },
  { name: 'Libra', emoji: '♎', dates: 'Sep 23 - Oct 22' },
  { name: 'Escorpio', emoji: '♏', dates: 'Oct 23 - Nov 21' },
  { name: 'Sagitario', emoji: '♐', dates: 'Nov 22 - Dic 21' },
  { name: 'Capricornio', emoji: '♑', dates: 'Dic 22 - Ene 19' },
  { name: 'Acuario', emoji: '♒', dates: 'Ene 20 - Feb 18' },
  { name: 'Piscis', emoji: '♓', dates: 'Feb 19 - Mar 20' },
];

export const PETS = [
  'Perros', 'Gatos', 'Pájaros', 'Peces', 'Reptiles',
  'Roedores', 'Ninguno', 'Otro',
];
