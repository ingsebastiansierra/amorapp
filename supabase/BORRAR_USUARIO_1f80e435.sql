-- Script para borrar usuario específico: 1f80e435-1d2e-4cb4-aa4f-7bb3a8adec35
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
    target_user_id UUID := '1f80e435-1d2e-4cb4-aa4f-7bb3a8adec35';
BEGIN
    RAISE NOTICE '🗑️ Iniciando eliminación del usuario: %', target_user_id;

    -- 1. Borrar estados emocionales
    DELETE FROM emotional_states WHERE user_id = target_user_id;
    RAISE NOTICE '✅ Estados emocionales eliminados';

    -- 2. Borrar gestos
    DELETE FROM gestures WHERE user_id = target_user_id;
    RAISE NOTICE '✅ Gestos eliminados';

    -- 3. Borrar interacciones de corazón
    DELETE FROM heart_interactions WHERE user_id = target_user_id;
    RAISE NOTICE '✅ Interacciones de corazón eliminadas';

    -- 4. Borrar imágenes privadas
    DELETE FROM private_images WHERE user_id = target_user_id;
    RAISE NOTICE '✅ Imágenes privadas eliminadas';

    -- 5. Borrar mensajes de sincronización
    DELETE FROM sync_messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
    RAISE NOTICE '✅ Mensajes de sincronización eliminados';

    -- 6. Borrar notas de voz
    DELETE FROM voice_notes WHERE user_id = target_user_id;
    RAISE NOTICE '✅ Notas de voz eliminadas';

    -- 7. Borrar sincronizaciones de relaciones
    DELETE FROM relationship_syncs WHERE user_id = target_user_id OR partner_id = target_user_id;
    RAISE NOTICE '✅ Sincronizaciones de relaciones eliminadas';

    -- 8. Borrar parejas
    DELETE FROM couples WHERE user1_id = target_user_id OR user2_id = target_user_id;
    RAISE NOTICE '✅ Parejas eliminadas';

    -- 9. Borrar perfil de usuario
    DELETE FROM users WHERE id = target_user_id;
    RAISE NOTICE '✅ Perfil de usuario eliminado';

    -- 10. Borrar de auth.users (requiere permisos de servicio)
    -- NOTA: Esto debe ejecutarse con permisos de servicio o desde el Dashboard
    DELETE FROM auth.users WHERE id = target_user_id;
    RAISE NOTICE '✅ Usuario de autenticación eliminado';

    RAISE NOTICE '🎉 Usuario eliminado completamente';
END $$;

-- Verificar que se eliminó
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = '1f80e435-1d2e-4cb4-aa4f-7bb3a8adec35') 
        THEN '❌ Usuario AÚN EXISTE en auth.users'
        ELSE '✅ Usuario ELIMINADO correctamente'
    END as resultado;
