// Servicio para manejar imágenes privadas
import { supabase } from '../config/supabase';
import { PrivateImage, SendPrivateImageOptions, ViewImageResult } from '../types/media';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

class MediaService {
  private readonly BUCKET_NAME = 'private-images';

  /**
   * Solicitar permisos de cámara y galería
   */
  async requestPermissions() {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return {
      camera: cameraPermission.status === 'granted',
      media: mediaPermission.status === 'granted',
    };
  }

  /**
   * Seleccionar imagen de la galería
   */
  async pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0];
    }
    return null;
  }

  /**
   * Tomar foto con la cámara
   */
  async takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0];
    }
    return null;
  }

  /**
   * Enviar imagen privada
   */
  async sendPrivateImage(
    toUserId: string,
    imageUri: string,
    options: SendPrivateImageOptions = {}
  ): Promise<PrivateImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    try {
      console.log('📤 Iniciando subida de imagen...');
      console.log('URI:', imageUri);
      console.log('User ID:', user.id);
      console.log('To User ID:', toUserId);

      // 1. Leer el archivo como base64
      console.log('📖 Leyendo archivo...');
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('✅ Archivo leído, tamaño base64:', base64.length);

      // 2. Convertir base64 a ArrayBuffer
      console.log('🔄 Convirtiendo a ArrayBuffer...');
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('✅ ArrayBuffer creado, tamaño:', bytes.length);

      // 3. Generar nombre único
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      console.log('📁 Ruta de archivo:', filePath);

      // 4. Subir a Supabase Storage
      console.log('☁️ Subiendo a Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, bytes.buffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Error en upload:', uploadError);
        throw uploadError;
      }
      console.log('✅ Archivo subido:', uploadData);

      // 5. Calcular expiración si se especificó
      const expiresAt = options.expiresInHours
        ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000).toISOString()
        : null;

      // 6. Crear registro en la base de datos
      console.log('💾 Creando registro en BD...');
      const { data, error } = await supabase
        .from('images_private')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          storage_path: filePath,
          media_type: 'photo',
          caption: options.caption,
          max_views: options.maxViews ?? 1,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error en BD:', error);
        throw error;
      }
      console.log('✅ Registro creado:', data);

      return data as PrivateImage;
    } catch (error) {
      console.error('❌ Error general en sendPrivateImage:', error);
      throw error;
    }
  }

  /**
   * Obtener imágenes pendientes (no vistas o no expiradas)
   */
  async getPendingImages(): Promise<PrivateImage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('images_private')
      .select('*')
      .eq('to_user_id', user.id)
      .eq('is_expired', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data as PrivateImage[]) || [];
  }

  /**
   * Obtener URL firmada de una imagen
   */
  async getImageUrl(storagePath: string, expiresIn: number = 60): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('No se pudo obtener URL');

    return data.signedUrl;
  }

  /**
   * Marcar imagen como vista
   */
  async markAsViewed(imageId: string): Promise<ViewImageResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase.rpc('mark_private_image_viewed', {
      image_id: imageId,
      viewer_id: user.id,
    });

    if (error) throw error;

    return data as ViewImageResult;
  }

  /**
   * Eliminar imagen (solo el remitente)
   */
  async deleteImage(imageId: string, storagePath: string): Promise<void> {
    // 1. Eliminar de storage
    const { error: storageError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([storagePath]);

    if (storageError) throw storageError;

    // 2. Eliminar registro de BD
    const { error: dbError } = await supabase
      .from('images_private')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;
  }

  /**
   * Suscribirse a nuevas imágenes en tiempo real
   */
  subscribeToNewImages(userId: string, callback: (image: PrivateImage) => void) {
    const channel = supabase
      .channel('private-images')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'images_private',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as PrivateImage);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}

export const mediaService = new MediaService();
