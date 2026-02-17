-- ⚠️ ADVERTENCIA: Este script BORRA TODOS LOS DATOS SENSIBLES
-- Ejecutar con precaución - NO SE PUEDE DESHACER
-- 
-- Este script limpia:
-- 1. Todos los mensajes de texto
-- 2. Todas las notas de voz (BD y archivos)
-- 3. Todas las imágenes privadas (BD y archivos)
-- 4. Todo el historial de estados emocionales
--
-- NO borra:
-- - Usuarios
-- - Parejas (relaciones)
-- - Avatares
-- - Configuraciones

BEGIN;

-- 1. BORRAR MENSAJES DE TEXTO
DELETE FROM sync_messages;
SELECT 'Mensajes de texto borrados' as resultado;

-- 2. BORRAR NOTAS DE VOZ (solo registros de BD)
-- Los archivos en storage se deben borrar desde la app o manualmente
DELETE FROM voice_notes;
SELECT 'Notas de voz borradas de BD' as resultado;

-- 3. BORRAR IMÁGENES PRIVADAS (solo registros de BD)
-- Los archivos en storage se deben borrar desde la app o manualmente
DELETE FROM images_private;
SELECT 'Imágenes privadas borradas de BD' as resultado;

-- 4. BORRAR HISTORIAL DE ESTADOS EMOCIONALES
-- Mantener solo el estado más reciente de cada usuario
DELETE FROM emotional_states
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM emotional_states
    ORDER BY user_id, created_at DESC
);
SELECT 'Historial de estados emocionales limpiado (manteniendo estado actual)' as resultado;

-- Verificar que todo se borró
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

-- NOTA IMPORTANTE:
-- Los archivos físicos en storage (voice-notes y private-images) 
-- deben borrarse manualmente o mediante código de la app.
-- 
-- Para borrar archivos de storage, ejecutar desde la app:
-- await supabase.storage.from('voice-notes').remove([...paths])
-- await supabase.storage.from('private-images').remove([...paths])
