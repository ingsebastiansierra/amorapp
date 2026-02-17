-- Script para obtener las rutas de archivos a borrar en storage
-- Copiar los resultados y usarlos en la app para borrar los archivos

-- ARCHIVOS DE VOZ A BORRAR
SELECT 
    'voice-notes' as bucket,
    name as path,
    created_at
FROM storage.objects
WHERE bucket_id = 'voice-notes'
ORDER BY created_at DESC;

-- ARCHIVOS DE IMÁGENES A BORRAR
SELECT 
    'private-images' as bucket,
    name as path,
    created_at
FROM storage.objects
WHERE bucket_id = 'private-images'
ORDER BY created_at DESC;

-- FUNCIÓN PARA BORRAR TODOS LOS ARCHIVOS DE UN BUCKET
-- (Ejecutar desde código de la app, no desde SQL)
/*
// Código TypeScript para borrar archivos:

// 1. Borrar todos los archivos de voz
const { data: voiceFiles } = await supabase.storage
  .from('voice-notes')
  .list();

if (voiceFiles) {
  const filePaths = voiceFiles.map(file => file.name);
  await supabase.storage
    .from('voice-notes')
    .remove(filePaths);
}

// 2. Borrar todos los archivos de imágenes
const { data: imageFiles } = await supabase.storage
  .from('private-images')
  .list();

if (imageFiles) {
  const filePaths = imageFiles.map(file => file.name);
  await supabase.storage
    .from('private-images')
    .remove(filePaths);
}
*/
