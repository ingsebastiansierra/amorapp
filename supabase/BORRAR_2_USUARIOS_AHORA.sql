-- ⚠️ BORRAR 2 USUARIOS ESPECÍFICOS - EJECUCIÓN DIRECTA
-- Este script borra completamente los usuarios:
-- e7936720-8fa9-45d5-ba76-b84d32c3f020
-- c60a2dba-06b8-4ad9-8457-559b84e39a32

-- ============================================
-- EJECUTAR TODO DE UNA VEZ
-- ============================================

DO $$
DECLARE
    user1_id UUID := 'e7936720-8fa9-45d5-ba76-b84d32c3f020';
    user2_id UUID := 'c60a2dba-06b8-4ad9-8457-559b84e39a32';
    couple_ids UUID[];
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE '🗑️ Iniciando borrado de usuarios...';
    
    -- Obtener couple_ids
    SELECT ARRAY_AGG(DISTINCT couple_id) INTO couple_ids
    FROM public.users
    WHERE id IN (user1_id, user2_id)
      AND couple_id IS NOT NULL;
    
    -- 1. Estados emocionales
    DELETE FROM public.emotional_states
    WHERE user_id IN (user1_id, user2_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Estados emocionales borrados: %', deleted_count;
    
    -- 2. Gestos
    DELETE FROM public.gestures
    WHERE from_user_id IN (user1_id, user2_id)
       OR to_user_id IN (user1_id, user2_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Gestos borrados: %', deleted_count;
    
    -- 3. Interacciones de corazón
    DELETE FROM public.heart_interactions
    WHERE from_user_id IN (user1_id, user2_id)
       OR to_user_id IN (user1_id, user2_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Interacciones de corazón borradas: %', deleted_count;
    
    -- 4. Imágenes privadas
    DELETE FROM public.images_private
    WHERE from_user_id IN (user1_id, user2_id)
       OR to_user_id IN (user1_id, user2_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Imágenes privadas borradas: %', deleted_count;
    
    -- 5. Mensajes de sincronización (si existe)
    BEGIN
        DELETE FROM public.sync_messages
        WHERE from_user_id IN (user1_id, user2_id)
           OR to_user_id IN (user1_id, user2_id);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ Mensajes de sincronización borrados: %', deleted_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ Tabla sync_messages no existe, saltando...';
    END;
    
    -- 6. Notas de voz (si existe)
    BEGIN
        DELETE FROM public.voice_notes
        WHERE from_user_id IN (user1_id, user2_id)
           OR to_user_id IN (user1_id, user2_id);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ Notas de voz borradas: %', deleted_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ Tabla voice_notes no existe, saltando...';
    END;
    
    -- 7. Sincronizaciones de relación (si existe)
    BEGIN
        DELETE FROM public.relationship_syncs
        WHERE user1_id IN (user1_id, user2_id)
           OR user2_id IN (user1_id, user2_id);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ Sincronizaciones de relación borradas: %', deleted_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ Tabla relationship_syncs no existe, saltando...';
    END;
    
    -- 8. Métricas y parejas
    IF couple_ids IS NOT NULL THEN
        DELETE FROM public.connection_metrics
        WHERE couple_id = ANY(couple_ids);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ Métricas de conexión borradas: %', deleted_count;
        
        DELETE FROM public.challenge_progress
        WHERE couple_id = ANY(couple_ids);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ Progreso de retos borrado: %', deleted_count;
        
        DELETE FROM public.couples
        WHERE id = ANY(couple_ids);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ Parejas borradas: %', deleted_count;
    END IF;
    
    -- 9. Usuarios de public.users
    DELETE FROM public.users
    WHERE id IN (user1_id, user2_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Usuarios borrados de public.users: %', deleted_count;
    
    -- 10. Usuarios de auth.users
    DELETE FROM auth.users
    WHERE id IN (user1_id, user2_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Usuarios borrados de auth.users: %', deleted_count;
    
    RAISE NOTICE '🎉 ¡Borrado completado exitosamente!';
    
END $$;

-- Verificar que se borraron
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Usuarios borrados exitosamente'
        ELSE '❌ ERROR: Aún existen ' || COUNT(*) || ' usuarios'
    END as resultado
FROM public.users
WHERE id IN (
    'e7936720-8fa9-45d5-ba76-b84d32c3f020',
    'c60a2dba-06b8-4ad9-8457-559b84e39a32'
);
