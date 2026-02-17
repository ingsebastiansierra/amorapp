-- Consultar todos los datos sensibles almacenados
-- Ejecutar estas consultas para ver qué hay guardado

-- 1. MENSAJES DE TEXTO
SELECT 
    id,
    from_user_id,
    to_user_id,
    message,
    created_at,
    read
FROM sync_messages
ORDER BY created_at DESC
LIMIT 50;

-- Contar mensajes totales
SELECT COUNT(*) as total_mensajes FROM sync_messages;

-- 2. NOTAS DE VOZ
SELECT 
    id,
    from_user_id,
    to_user_id,
    storage_path,
    duration,
    listened,
    created_at
FROM voice_notes
ORDER BY created_at DESC
LIMIT 50;

-- Contar notas de voz totales
SELECT COUNT(*) as total_voice_notes FROM voice_notes;

-- 3. IMÁGENES PRIVADAS
SELECT 
    id,
    from_user_id,
    to_user_id,
    storage_path,
    caption,
    viewed,
    is_expired,
    created_at
FROM images_private
ORDER BY created_at DESC
LIMIT 50;

-- Contar imágenes privadas totales
SELECT COUNT(*) as total_imagenes FROM images_private;

-- 4. ESTADOS EMOCIONALES (historial)
SELECT 
    id,
    user_id,
    state,
    created_at
FROM emotional_states
ORDER BY created_at DESC
LIMIT 50;

-- Contar estados emocionales totales
SELECT COUNT(*) as total_estados FROM emotional_states;

-- 5. ARCHIVOS EN STORAGE
-- Listar buckets de storage
SELECT 
    name,
    public,
    created_at
FROM storage.buckets;

-- Listar archivos en voice-notes
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'voice-notes'
ORDER BY created_at DESC
LIMIT 50;

-- Contar archivos de voz
SELECT COUNT(*) as total_archivos_voz 
FROM storage.objects 
WHERE bucket_id = 'voice-notes';

-- Listar archivos en private-images
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'private-images'
ORDER BY created_at DESC
LIMIT 50;

-- Contar archivos de imágenes
SELECT COUNT(*) as total_archivos_imagenes 
FROM storage.objects 
WHERE bucket_id = 'private-images';

-- RESUMEN GENERAL
SELECT 
    'Mensajes' as tipo,
    COUNT(*) as cantidad
FROM sync_messages
UNION ALL
SELECT 
    'Notas de voz' as tipo,
    COUNT(*) as cantidad
FROM voice_notes
UNION ALL
SELECT 
    'Imágenes privadas' as tipo,
    COUNT(*) as cantidad
FROM images_private
UNION ALL
SELECT 
    'Estados emocionales' as tipo,
    COUNT(*) as cantidad
FROM emotional_states
UNION ALL
SELECT 
    'Archivos de voz (storage)' as tipo,
    COUNT(*) as cantidad
FROM storage.objects
WHERE bucket_id = 'voice-notes'
UNION ALL
SELECT 
    'Archivos de imágenes (storage)' as tipo,
    COUNT(*) as cantidad
FROM storage.objects
WHERE bucket_id = 'private-images';
