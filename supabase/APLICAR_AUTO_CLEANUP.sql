-- Aplicar migración de limpieza automática
\i supabase/migrations/016_auto_cleanup.sql

-- Probar las funciones

-- 1. Ver cuántos datos antiguos hay (más de 7 días)
SELECT 
    'Mensajes > 7 días' as tipo,
    COUNT(*) as cantidad
FROM sync_messages
WHERE created_at < NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'Notas de voz > 7 días' as tipo,
    COUNT(*) as cantidad
FROM voice_notes
WHERE created_at < NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'Imágenes > 7 días' as tipo,
    COUNT(*) as cantidad
FROM images_private
WHERE created_at < NOW() - INTERVAL '7 days';

-- 2. Ejecutar limpieza de prueba (comentar para no ejecutar)
-- SELECT * FROM cleanup_all_old_data(7, 7, 7, 30);

-- 3. Para borrar TODO el historial de una pareja específica:
-- SELECT * FROM delete_couple_history('UUID-DE-LA-PAREJA');

-- NOTA: Para ejecutar la limpieza automática periódicamente,
-- se debe configurar un cron job o ejecutar desde la app.
