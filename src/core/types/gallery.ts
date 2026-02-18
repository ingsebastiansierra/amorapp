// Tipos para el sistema de galería personal

export type GalleryVisibility = 'private' | 'visible';

export interface PersonalGalleryImage {
  id: string;
  user_id: string;
  image_path: string;
  thumbnail_path: string | null;
  visibility: GalleryVisibility;
  caption: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryUploadOptions {
  caption?: string;
  visibility?: GalleryVisibility;
}
