import { supabase } from '@/core/config/supabase';
import * as ImagePicker from 'expo-image-picker';

export interface UploadAvatarResult {
  url: string;
  path: string;
}

export const avatarService = {
  async pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Se necesitan permisos para acceder a la galería');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  },

  async uploadAvatar(userId: string, imageUri: string): Promise<UploadAvatarResult> {
    try {
      // Usar fetch para obtener el blob de la imagen
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convertir blob a ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      
      // Generar nombre único para el archivo
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path,
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) throw error;
  },

  async deleteAvatar(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([path]);

    if (error) throw error;
  },

  getAvatarUrl(avatarUrl: string | null): string | null {
    if (!avatarUrl) return null;
    
    // Si ya es una URL completa, devolverla
    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    
    // Si es una ruta, construir la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarUrl);
    
    return publicUrl;
  },
};
