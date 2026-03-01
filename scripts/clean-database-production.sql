-- ============================================
-- SCRIPT DE LIMPIEZA COMPLETA DE BASE DE DATOS
-- Para preparar la app para producción
-- ============================================
-- ADVERTENCIA: Este script eliminará TODOS los datos de prueba
-- Ejecutar SOLO antes de lanzar a producción
-- ============================================

-- Desactivar triggers temporalmente para evitar problemas de dependencias
SET session_replication_role = 'replica';

-- ============================================
-- 1. LIMPIAR TABLAS DE INTERACCIONES Y MENSAJES
-- ============================================

-- Eliminar mensajes de sincronización emocional
DELETE FROM public.sync_messages;
NOTIFY pgrst, 'reload schema';

-- Eliminar mensajes regulares
DELETE FROM public.messages;
NOTIFY pgrst, 'reload schema';

-- Eliminar notas de voz
DELETE FROM public.voice_notes;
NOTIFY pgrst, 'reload schema';

-- Eliminar imágenes privadas
DELETE FROM public.images_private;
NOTIFY pgrst, 'reload schema';

-- Eliminar galería personal
DELETE FROM public.personal_gallery;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 2. LIMPIAR TABLAS DE CONEXIONES Y RELACIONES
-- ============================================

-- Eliminar eventos de pareja
DELETE FROM public.couple_events;
NOTIFY pgrst, 'reload schema';

-- Eliminar progreso de desafíos
DELETE FROM public.challenge_progress;
NOTIFY pgrst, 'reload schema';

-- Eliminar rachas de sincronización
DELETE FROM public.sync_streaks;
NOTIFY pgrst, 'reload schema';

-- Eliminar sincronizaciones emocionales
DELETE FROM public.emotional_syncs;
NOTIFY pgrst, 'reload schema';

-- Eliminar métricas de conexión
DELETE FROM public.connection_metrics;
NOTIFY pgrst, 'reload schema';

-- Eliminar parejas
DELETE FROM public.couples;
NOTIFY pgrst, 'reload schema';

-- Eliminar conexiones
DELETE FROM public.connections;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 3. LIMPIAR TABLAS DE MATCHING Y SWIPES
-- ============================================

-- Eliminar matches
DELETE FROM public.matches;
NOTIFY pgrst, 'reload schema';

-- Eliminar swipes
DELETE FROM public.swipes;
NOTIFY pgrst, 'reload schema';

-- Eliminar caché de compatibilidad
DELETE FROM public.compatibility_cache;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 4. LIMPIAR TABLAS DE INTERACCIONES EMOCIONALES
-- ============================================

-- Eliminar estados emocionales
DELETE FROM public.emotional_states;
NOTIFY pgrst, 'reload schema';

-- Eliminar gestos
DELETE FROM public.gestures;
NOTIFY pgrst, 'reload schema';

-- Eliminar interacciones de corazón
DELETE FROM public.heart_interactions;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 5. LIMPIAR TABLAS DE MODERACIÓN
-- ============================================

-- Eliminar reportes
DELETE FROM public.reports;
NOTIFY pgrst, 'reload schema';

-- Eliminar bloqueos
DELETE FROM public.blocks;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 6. LIMPIAR TABLAS DE PREFERENCIAS Y PERFIL
-- ============================================

-- Eliminar intenciones de usuario
DELETE FROM public.user_intentions;
NOTIFY pgrst, 'reload schema';

-- Eliminar intereses de usuario
DELETE FROM public.user_interests;
NOTIFY pgrst, 'reload schema';

-- Eliminar preferencias de usuario
DELETE FROM public.user_preferences;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 7. LIMPIAR SUGERENCIAS DE USUARIOS
-- ============================================

-- Eliminar sugerencias de usuarios
DELETE FROM public.user_suggestions;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 8. LIMPIAR TABLA DE USUARIOS (PUBLIC)
-- ============================================

-- Eliminar todos los usuarios de la tabla public.users
DELETE FROM public.users;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 9. LIMPIAR AUTENTICACIÓN (AUTH.USERS)
-- ============================================

-- Eliminar todos los usuarios de autenticación
-- NOTA: Esto eliminará TODOS los usuarios incluyendo administradores
DELETE FROM auth.users;
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 10. REINICIAR SECUENCIAS Y CONTADORES
-- ============================================

-- Reiniciar contadores de version_code si existen
-- (Ajustar según tu implementación específica)

-- ============================================
-- 11. REACTIVAR TRIGGERS
-- ============================================

-- Reactivar triggers
SET session_replication_role = 'origin';

-- ============================================
-- 12. ANALYZE (Actualizar estadísticas)
-- ============================================

-- Actualizar estadísticas de las tablas
-- NOTA: VACUUM debe ejecutarse por separado fuera de transacciones
ANALYZE public.users;
ANALYZE public.messages;
ANALYZE public.connections;
ANALYZE public.couples;
ANALYZE public.images_private;
ANALYZE public.voice_notes;
ANALYZE public.sync_messages;
ANALYZE public.matches;
ANALYZE public.swipes;
ANALYZE auth.users;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Contar registros en tablas principales (debe ser 0)
SELECT 
    'users' as tabla, COUNT(*) as registros FROM public.users
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL
SELECT 'connections', COUNT(*) FROM public.connections
UNION ALL
SELECT 'couples', COUNT(*) FROM public.couples
UNION ALL
SELECT 'images_private', COUNT(*) FROM public.images_private
UNION ALL
SELECT 'voice_notes', COUNT(*) FROM public.voice_notes
UNION ALL
SELECT 'matches', COUNT(*) FROM public.matches
UNION ALL
SELECT 'swipes', COUNT(*) FROM public.swipes
UNION ALL
SELECT 'sync_messages', COUNT(*) FROM public.sync_messages
UNION ALL
SELECT 'emotional_states', COUNT(*) FROM public.emotional_states
UNION ALL
SELECT 'user_interests', COUNT(*) FROM public.user_interests
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM public.user_preferences
UNION ALL
SELECT 'user_intentions', COUNT(*) FROM public.user_intentions
UNION ALL
SELECT 'reports', COUNT(*) FROM public.reports
UNION ALL
SELECT 'blocks', COUNT(*) FROM public.blocks;

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
-- La base de datos está ahora completamente limpia
-- y lista para producción
-- ============================================
