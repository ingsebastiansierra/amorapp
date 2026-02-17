-- ⚠️ BORRAR TODOS LOS DATOS DE PRUEBA AHORA
-- Este script borra:
-- - 20 mensajes
-- - 3 notas de voz (BD)
-- - 10 imágenes privadas (BD)
-- - Historial de estados emocionales (mantiene solo el actual)
-- 
-- NOTA: Los archivos de storage (7 audios, 3 imágenes) se deben borrar manualmente
-- después de ejecutar este script.

BEGIN;

-- 1. BORRAR TODOS LOS MENSAJES
DELETE FROM sync_messages;
SELECT '✅ Mensajes borrados' as resultado, COUNT(*) as cantidad_antes FROM sync_messages;

-- 2. BORRAR TODAS LAS NOTAS DE VOZ (BD)
-- Primero obtener las rutas para borrar de storage después
SELECT 
    '📋 RUTAS DE AUDIO A BORRAR DE STORAGE:' as nota,
    storage_path
FROM voice_notes;

DELETE FROM voice_notes;
SELECT '✅ Notas de voz borradas de BD' as resultado;

-- 3. BORRAR TODAS LAS IMÁGENES PRIVADAS (BD)
-- Primero obtener las rutas para borrar de storage después
SELECT 
    '📋 RUTAS DE IMÁGENES A BORRAR DE STORAGE:' as nota,
    storage_path
FROM images_private;

DELETE FROM images_private;
SELECT '✅ Imágenes privadas borradas de BD' as resultado;

-- 4. LIMPIAR HISTORIAL DE ESTADOS EMOCIONALES
-- Mantener solo el estado más reciente de cada usuario
DELETE FROM emotional_states
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM emotional_states
    ORDER BY user_id, created_at DESC
);
SELECT '✅ Historial de estados emocionales limpiado' as resultado;

-- VERIFICAR QUE TODO SE BORRÓ
SELECT 
    'Mensajes restantes' as tipo,
    COUNT(*) as cantidad
FROM sync_messages
UNION ALL
SELECT 
    'Notas de voz restantes' as tipo,
    COUNT(*) as cantidad
FROM voice_notes
UNION ALL
SELECT 
    'Imágenes privadas restantes' as tipo,
    COUNT(*) as cantidad
FROM images_private
UNION ALL
SELECT 
    'Estados emocionales restantes' as tipo,
    COUNT(*) as cantidad
FROM emotional_states;

COMMIT;

-- ⚠️ IMPORTANTE: AHORA DEBES BORRAR LOS ARCHIVOS DE STORAGE
-- 
-- Opción 1: Desde la interfaz de Supabase
-- 1. Ve a Storage > voice-notes
-- 2. Selecciona todos los archivos y bórralos
-- 3. Ve a Storage > private-images
-- 4. Selecciona todos los archivos y bórralos
--
-- Opción 2: Desde SQL (ejecutar después de este script)
-- Ver archivo: BORRAR_STORAGE_AHORA.sql
