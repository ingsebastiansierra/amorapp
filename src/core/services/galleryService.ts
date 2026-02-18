// Servicio para manejar la galería personal
import { supabase } from '../config/supabase';
import { PersonalGalleryImage, GalleryUploadOptions } from '../types/gallery';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

class GalleryService {
  private readonly BUCKET_NAME = 'personal-gallery';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Obtener mis fotos de galería
   */
  async getMyPhotos(userId: string): Promise<PersonalGalleryImage[]> {
    try {
      const { data, error } = await supabase
        .from('personal_gallery')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading my photos:', error);
      throw error;
    }
  }

  /**
   * Obtener fotos visibles de mi pareja
   */
  async getPartnerPhotos(partnerId: string): Promise<PersonalGalleryImage[]> {
    try {
      const { data, error } = await supabase
        .from('personal_gallery')
        .select('*')
        .eq('user_id', partnerId)
        .eq('visibility', 'visible')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading partner photos:', error);
      throw error;
    }
  }

  /**
   * Subir una foto a la galería
   */
  async uploadPhoto(
    userId: string,
    imageUri: string,
    options: GalleryUploadOptions = {}
  ): Promise<PersonalGalleryImage> {
    try {
      console.log('📤 Iniciando subida de foto...');
      console.log('User ID:', userId);
      console.log('Image URI:', imageUri);

      // Generar nombres únicos
      const timestamp = Date.now();
      const imagePath = `${userId}/${timestamp}.jpg`;
      console.log('📁 Ruta de subida:', imagePath);

      // Leer archivo como ArrayBuffer (más compatible)
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      
      console.log('📦 Archivo preparado, tamaño:', arrayBuffer.byteLength);

      // Subir imagen principal
      console.log('⬆️ Subiendo a storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(imagePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Error de storage:', uploadError);
        throw new Error(`Error al subir: ${uploadError.message}`);
      }

      console.log('✅ Imagen subida exitosamente');
      console.log('📊 Guardando en base de datos...');

      // Guardar en base de datos
      const { data, error: dbError } = await supabase
        .from('personal_gallery')
        .insert({
          user_id: userId,
          image_path: imagePath,
          thumbnail_path: imagePath,
          visibility: options.visibility || 'private',
          caption: options.caption || null,
          file_size: arrayBuffer.byteLength,
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Error de base de datos:', dbError);
        throw new Error(`Error en BD: ${dbError.message}`);
      }

      console.log('✅ Foto guardada correctamente');
      return data;
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      throw new Error(error.message || 'Error al subir la foto');
    }
  }

  /**
   * Actualizar visibilidad de una foto
   */
  async updateVisibility(
    photoId: string,
    visibility: 'private' | 'visible'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('personal_gallery')
        .update({ visibility })
        .eq('id', photoId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating visibility:', error);
      throw error;
    }
  }

  /**
   * Eliminar una foto
   */
  async deletePhoto(photoId: string, imagePath: string, thumbnailPath: string | null): Promise<void> {
    try {
      // Eliminar archivos del storage
      await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([imagePath]);

      if (thumbnailPath && thumbnailPath !== imagePath) {
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([thumbnailPath]);
      }

      // Eliminar registro de la base de datos
      const { error } = await supabase
        .from('personal_gallery')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Obtener URL pública de una imagen
   */
  getImageUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Seleccionar imagen de la galería
   */
  async pickImage(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Se necesita permiso para acceder a la galería');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  }

  /**
   * Tomar foto con la cámara
   */
  async takePhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Se necesita permiso para acceder a la cámara');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  }
}

export const galleryService = new GalleryService();
