-- Script para borrar TODOS los archivos de storage
-- Ejecutar DESPUÉS de BORRAR_TODO_AHORA.sql
--
-- NOTA: Este script solo lista los archivos.
-- Para borrarlos, debes usar la interfaz de Supabase o código TypeScript.

-- Ver todos los archivos de voz en storage
SELECT 
    'voice-notes' as bucket,
    name as archivo,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'voice-notes'
ORDER BY created_at DESC;

-- Ver todos los archivos de imágenes en storage
SELECT 
    'private-images' as bucket,
    name as archivo,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'private-images'
ORDER BY created_at DESC;

-- ⚠️ PARA BORRAR LOS ARCHIVOS, ejecuta este código TypeScript en tu app:

/*
import { supabase } from '@/core/config/supabase';

async function deleteAllStorageFiles() {
  try {
    // 1. Borrar todos los archivos de voz
    const { data: voiceFiles } = await supabase.storage
      .from('voice-notes')
      .list();

    if (voiceFiles && voiceFiles.length > 0) {
      const voicePaths = voiceFiles.map(file => file.name);
      const { error: voiceError } = await supabase.storage
        .from('voice-notes')
        .remove(voicePaths);
      
      if (voiceError) {
        console.error('Error borrando audios:', voiceError);
      } else {
        console.log(`✅ ${voicePaths.length} archivos de audio borrados`);
      }
    }

    // 2. Borrar todos los archivos de imágenes
    const { data: imageFiles } = await supabase.storage
      .from('private-images')
      .list();

    if (imageFiles && imageFiles.length > 0) {
      const imagePaths = imageFiles.map(file => file.name);
      const { error: imageError } = await supabase.storage
        .from('private-images')
        .remove(imagePaths);
      
      if (imageError) {
        console.error('Error borrando imágenes:', imageError);
      } else {
        console.log(`✅ ${imagePaths.length} archivos de imagen borrados`);
      }
    }

    console.log('🧹 Limpieza de storage completada');
  } catch (error) {
    console.error('Error en limpieza de storage:', error);
  }
}

// Ejecutar
deleteAllStorageFiles();
*/

-- O desde la interfaz web de Supabase:
-- 1. Ve a https://supabase.com/dashboard/project/TU_PROYECTO/storage/buckets
-- 2. Entra a "voice-notes"
-- 3. Selecciona todos los archivos (checkbox arriba)
-- 4. Click en "Delete" (icono de basura)
-- 5. Repite para "private-images"
