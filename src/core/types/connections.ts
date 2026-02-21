// ============================================
// TIPOS: Sistema de Conexiones y Matches
// ============================================

export type ConnectionStatus =
  | 'pending'    // Solicitud pendiente
  | 'active'     // Conexión activa
  | 'muted'      // Silenciada
  | 'blocked'    // Bloqueada
  | 'ended';     // Terminada

export type MatchStatus =
  | 'pending'    // Match pendiente
  | 'accepted'   // Aceptado
  | 'rejected'   // Rechazado
  | 'expired';   // Expirado

export type SwipeAction =
  | 'like'       // Me gusta
  | 'pass'       // Pasar
  | 'super_like'; // Super like

export type MessageType =
  | 'text'       // Mensaje de texto
  | 'image'      // Imagen
  | 'voice'      // Nota de voz
  | 'system';    // Mensaje del sistema

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'fake'
  | 'scam'
  | 'other';

export type ReportStatus =
  | 'pending'
  | 'reviewing'
  | 'resolved'
  | 'dismissed';

// ============================================
// INTERFACES
// ============================================

export interface Connection {
  id: string;
  
  // Usuarios
  user1_id: string;
  user2_id: string;
  initiated_by: string;
  
  // Estado
  status: ConnectionStatus;
  
  // Mensaje inicial
  initial_message?: string;
  initial_intention?: string;
  
  // Permisos
  can_see_emotions: boolean;
  can_send_messages: boolean;
  can_see_location: boolean;
  can_send_media: boolean;
  
  // Estadísticas
  messages_count: number;
  syncs_count: number;
  last_message_at?: string;
  
  // Límites
  daily_message_limit: number;
  
  // Metadata
  created_at: string;
  accepted_at?: string;
  ended_at?: string;
}

export interface Match {
  id: string;
  
  // Usuarios
  user_id: string;
  matched_user_id: string;
  
  // Datos del match
  intention_at_match?: string;
  compatibility_score: number; // 0-100
  distance_km?: number;
  
  // Estado
  status: MatchStatus;
  
  // Metadata
  matched_at: string;
  expires_at: string;
  responded_at?: string;
}

export interface Message {
  id: string;
  
  // Conexión
  connection_id: string;
  
  // Usuarios
  from_user_id: string;
  to_user_id: string;
  
  // Contenido
  message: string;
  message_type: MessageType;
  
  // Estado
  read: boolean;
  read_at?: string;
  
  // Metadata
  created_at: string;
  
  // Respuesta
  reply_to_message_id?: string;
}

export interface Swipe {
  id: string;
  
  // Usuarios
  user_id: string;
  swiped_user_id: string;
  
  // Acción
  action: SwipeAction;
  
  // Metadata
  created_at: string;
}

export interface Report {
  id: string;
  
  // Usuarios
  reported_user_id: string;
  reported_by: string;
  
  // Reporte
  reason: ReportReason;
  description: string;
  evidence?: string[];
  
  // Estado
  status: ReportStatus;
  admin_notes?: string;
  
  // Metadata
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Block {
  id: string;
  
  // Usuarios
  blocker_user_id: string;
  blocked_user_id: string;
  
  // Metadata
  created_at: string;
}

export interface CompatibilityCache {
  id: string;
  
  // Usuarios
  user1_id: string;
  user2_id: string;
  
  // Score
  compatibility_score: number;
  common_interests?: CommonInterests;
  
  // Metadata
  calculated_at: string;
  expires_at: string;
}

export interface CommonInterests {
  music?: string[];
  hobbies?: string[];
  sports?: string[];
  food?: string[];
  values?: string[];
  total_count: number;
}

// ============================================
// PERFIL PÚBLICO EXTENDIDO
// ============================================

export interface PublicUserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bio?: string;
  photos: string[];
  avatar_url?: string;
  
  // Ubicación
  location?: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  distance_km?: number; // Distancia desde el usuario actual
  
  // Estado
  is_available: boolean;
  is_verified: boolean;
  is_premium: boolean;
  last_active?: string;
  
  // Intención actual
  current_intention?: {
    type: string;
    activity?: string;
    availability: string;
  };
  
  // Intereses (resumen)
  interests_summary?: {
    music_artist?: string;
    favorite_sport?: string;
    favorite_food?: string;
    hobbies: string[];
  };
  
  // Compatibilidad
  compatibility_score?: number;
  common_interests?: CommonInterests;
}

// ============================================
// CHAT CON INFORMACIÓN DEL USUARIO
// ============================================

export interface ChatPreview {
  connection: Connection;
  partner: {
    id: string;
    name: string;
    avatar_url?: string;
    current_emotion?: string;
    is_synced: boolean;
  };
  last_message?: {
    text: string;
    created_at: string;
    from_me: boolean;
  };
  unread_count: number;
}

// ============================================
// NOTIFICACIONES
// ============================================

export interface MatchNotification {
  type: 'new_match';
  match: Match;
  user: PublicUserProfile;
}

export interface MessageNotification {
  type: 'new_message';
  message: Message;
  connection: Connection;
  sender: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface SyncNotification {
  type: 'emotional_sync';
  connection: Connection;
  partner: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  emotion: string;
}

export type AppNotification = 
  | MatchNotification 
  | MessageNotification 
  | SyncNotification;

// ============================================
// LÍMITES Y CONFIGURACIÓN
// ============================================

export const CONNECTION_LIMITS = {
  // Conexiones
  max_active_connections: 10,
  max_active_connections_premium: 50,
  max_pending_requests: 5,
  max_requests_per_day: 20,
  max_requests_per_day_premium: 100,
  
  // Mensajes
  messages_per_day_per_chat: 50,
  messages_per_day_per_chat_premium: -1, // Ilimitado
  messages_per_hour: 100,
  
  // Swipes
  swipes_per_day: 100,
  swipes_per_day_premium: -1, // Ilimitado
  
  // Cooldowns
  reject_cooldown_hours: 24,
  request_cooldown_minutes: 5,
  
  // Reportes
  max_reports_before_review: 3,
  auto_ban_after_reports: 5,
  
  // Matches
  match_expiration_hours: 24,
};

// ============================================
// HELPERS
// ============================================

export function getPartnerIdFromConnection(connection: Connection, myUserId: string): string {
  return connection.user1_id === myUserId ? connection.user2_id : connection.user1_id;
}

export function isConnectionActive(connection: Connection): boolean {
  return connection.status === 'active';
}

export function canSendMessage(connection: Connection): boolean {
  return connection.status === 'active' && connection.can_send_messages;
}

export function isMatchExpired(match: Match): boolean {
  return new Date(match.expires_at) < new Date();
}

export function getCompatibilityLevel(score: number): {
  level: 'low' | 'medium' | 'high' | 'perfect';
  label: string;
  color: string;
} {
  if (score >= 90) {
    return { level: 'perfect', label: 'Perfecta', color: '#10B981' };
  } else if (score >= 70) {
    return { level: 'high', label: 'Alta', color: '#3B82F6' };
  } else if (score >= 50) {
    return { level: 'medium', label: 'Media', color: '#F59E0B' };
  } else {
    return { level: 'low', label: 'Baja', color: '#EF4444' };
  }
}
