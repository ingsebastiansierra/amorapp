// Tipos para el sistema de medios privados

export type MediaType = 'photo' | 'video';

export interface PrivateImage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  storage_path: string;
  media_type: MediaType;
  thumbnail_path?: string;
  caption?: string;
  view_count: number;
  max_views: number;
  viewed: boolean;
  viewed_at?: string;
  is_expired: boolean;
  file_size?: number;
  duration?: number;
  expires_at?: string;
  created_at: string;
}

export interface SendPrivateImageOptions {
  caption?: string;
  maxViews?: number; // 1 = ver una vez, null = ilimitado
  expiresInHours?: number;
}

export interface ViewImageResult {
  success: boolean;
  expired?: boolean;
  views_remaining?: number;
  error?: string;
  message?: string;
}
