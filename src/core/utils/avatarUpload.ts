// Utilidad para subir avatars de forma robusta
import { supabase } from '@core/config/supabase';

export interface AvatarUploadResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

export async function uploadAvatar(
  userId: string, 
  avatarUri: string
): Promise<AvatarUploadResult> {
  try {
    console.log('📸 [AVATAR] Iniciando subida de avatar...');
    
    // Validar URI
    if (!avatarUri || (!avatarUri.startsWith('file://') && !avatarUri.startsWith('content://'))) {
      return { success: false, error: 'URI de avatar inválida' };
    }
    
    // Generar nombre de archivo único con estructura de carpeta
    const fileExt = avatarUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    console.log('📸 [AVATAR] Descargando imagen...');
    const response = await fetch(avatarUri);
    
    if (!response.ok) {
      return { success: false, error: `Error descargando imagen: ${response.status}` };
    }
    
    const blob = await response.blob();
    console.log('📸 [AVATAR] Imagen descargada, tamaño:', blob.size, 'bytes');
    
    // Verificar tamaño (máximo 5MB)
    if (blob.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Imagen muy grande (máximo 5MB)' };
    }
    
    // Verificar tipo de archivo
    if (!blob.type.startsWith('image/')) {
      return { success: false, error: 'El archivo debe ser una imagen' };
    }
    
    console.log('📸 [AVATAR] Subiendo a Supabase Storage...');
    
    // Intentar subir con diferentes configuraciones
    const uploadConfigs = [
      // Configuración 1: Con contentType específico
      {
        contentType: blob.type,
        upsert: false,
      },
      // Configuración 2: Sin contentType específico
      {
        upsert: false,
      },
      // Configuración 3: Con upsert habilitado
      {
        contentType: blob.type,
        upsert: true,
      }
    ];
    
    for (let i = 0; i < uploadConfigs.length; i++) {
      const config = uploadConfigs[i];
      console.log(`📸 [AVATAR] Intento ${i + 1} con configuración:`, config);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, config);
      
      if (!uploadError && uploadData) {
        console.log('✅ [AVATAR] Avatar subido exitosamente:', fileName);
        return { success: true, fileName };
      }
      
      console.warn(`⚠️ [AVATAR] Intento ${i + 1} falló:`, uploadError?.message);
      
      // Si es el último intento, devolver el error
      if (i === uploadConfigs.length - 1) {
        return { 
          success: false, 
          error: uploadError?.message || 'Error desconocido al subir avatar' 
        };
      }
    }
    
    return { success: false, error: 'Todos los intentos de subida fallaron' };
    
  } catch (error: any) {
    console.error('💥 [AVATAR] Error inesperado:', error);
    return { success: false, error: error.message || 'Error inesperado' };
  }
}

export async function updateUserAvatar(userId: string, fileName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users')
      .update({ avatar_url: fileName })
      .eq('id', userId);
      
    if (error) {
      console.error('❌ [AVATAR] Error actualizando perfil:', error);
      return false;
    }
    
    console.log('✅ [AVATAR] Perfil actualizado con avatar');
    return true;
  } catch (error: any) {
    console.error('💥 [AVATAR] Error actualizando perfil:', error);
    return false;
  }
}