-- Aplicar migración de limpieza automática
-- Copiar y pegar TODO este contenido en el SQL Editor de Supabase

-- ============================================
-- FUNCIONES DE LIMPIEZA AUTOMÁTICA
-- ============================================

-- Función para limpiar mensajes antiguos
CREATE OR REPLACE FUNCTION cleanup_old_messages(days_old INTEGER DEFAULT 7)
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
    count INTEGER;
BEGIN
    DELETE FROM sync_messages
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS count = ROW_COUNT;
    RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar notas de voz antiguas
CREATE OR REPLACE FUNCTION cleanup_old_voice_notes(days_old INTEGER DEFAULT 7)
RETURNS TABLE(deleted_count INTEGER, storage_paths TEXT[]) AS $$
DECLARE
    count INTEGER;
    paths TEXT[];
BEGIN
    -- Obtener las rutas de storage antes de borrar
    SELECT ARRAY_AGG(storage_path) INTO paths
    FROM voice_notes
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
    
    -- Borrar registros de BD
    DELETE FROM voice_notes
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS count = ROW_COUNT;
    RETURN QUERY SELECT count, paths;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar imágenes privadas antiguas
CREATE OR REPLACE FUNCTION cleanup_old_private_images(days_old INTEGER DEFAULT 7)
RETURNS TABLE(deleted_count INTEGER, storage_paths TEXT[]) AS $$
DECLARE
    count INTEGER;
    paths TEXT[];
BEGIN
    -- Obtener las rutas de storage antes de borrar
    SELECT ARRAY_AGG(storage_path) INTO paths
    FROM images_private
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
    
    -- Borrar registros de BD
    DELETE FROM images_private
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS count = ROW_COUNT;
    RETURN QUERY SELECT count, paths;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar historial de estados emocionales
CREATE OR REPLACE FUNCTION cleanup_old_emotional_states(days_old INTEGER DEFAULT 30)
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
    count INTEGER;
BEGIN
    -- Mantener solo el estado más reciente de cada usuario y los de los últimos X días
    DELETE FROM emotional_states
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND id NOT IN (
        SELECT DISTINCT ON (user_id) id
        FROM emotional_states
        ORDER BY user_id, created_at DESC
    );
    
    GET DIAGNOSTICS count = ROW_COUNT;
    RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función maestra que ejecuta toda la limpieza
CREATE OR REPLACE FUNCTION cleanup_all_old_data(
    message_days INTEGER DEFAULT 7,
    voice_days INTEGER DEFAULT 7,
    image_days INTEGER DEFAULT 7,
    emotion_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    msg_count INTEGER;
    voice_count INTEGER;
    voice_paths TEXT[];
    image_count INTEGER;
    image_paths TEXT[];
    emotion_count INTEGER;
BEGIN
    -- Limpiar mensajes
    SELECT deleted_count INTO msg_count
    FROM cleanup_old_messages(message_days);
    
    -- Limpiar notas de voz
    SELECT deleted_count, storage_paths INTO voice_count, voice_paths
    FROM cleanup_old_voice_notes(voice_days);
    
    -- Limpiar imágenes
    SELECT deleted_count, storage_paths INTO image_count, image_paths
    FROM cleanup_old_private_images(image_days);
    
    -- Limpiar estados emocionales
    SELECT deleted_count INTO emotion_count
    FROM cleanup_old_emotional_states(emotion_days);
    
    RETURN json_build_object(
        'messages_deleted', msg_count,
        'voice_notes_deleted', voice_count,
        'voice_storage_paths', voice_paths,
        'images_deleted', image_count,
        'image_storage_paths', image_paths,
        'emotional_states_deleted', emotion_count,
        'cleaned_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para borrar TODO el historial de una pareja
CREATE OR REPLACE FUNCTION delete_couple_history(couple_uuid UUID)
RETURNS JSON AS $$
DECLARE
    msg_count INTEGER;
    voice_count INTEGER;
    voice_paths TEXT[];
    image_count INTEGER;
    image_paths TEXT[];
BEGIN
    -- Obtener rutas de storage antes de borrar
    SELECT ARRAY_AGG(storage_path) INTO voice_paths
    FROM voice_notes vn
    WHERE EXISTS (
        SELECT 1 FROM users u
        WHERE u.couple_id = couple_uuid
        AND (u.id = vn.from_user_id OR u.id = vn.to_user_id)
    );
    
    SELECT ARRAY_AGG(storage_path) INTO image_paths
    FROM images_private ip
    WHERE EXISTS (
        SELECT 1 FROM users u
        WHERE u.couple_id = couple_uuid
        AND (u.id = ip.from_user_id OR u.id = ip.to_user_id)
    );
    
    -- Borrar mensajes
    DELETE FROM sync_messages
    WHERE couple_id = couple_uuid;
    GET DIAGNOSTICS msg_count = ROW_COUNT;
    
    -- Borrar notas de voz
    DELETE FROM voice_notes vn
    WHERE EXISTS (
        SELECT 1 FROM users u
        WHERE u.couple_id = couple_uuid
        AND (u.id = vn.from_user_id OR u.id = vn.to_user_id)
    );
    GET DIAGNOSTICS voice_count = ROW_COUNT;
    
    -- Borrar imágenes
    DELETE FROM images_private ip
    WHERE EXISTS (
        SELECT 1 FROM users u
        WHERE u.couple_id = couple_uuid
        AND (u.id = ip.from_user_id OR u.id = ip.to_user_id)
    );
    GET DIAGNOSTICS image_count = ROW_COUNT;
    
    RETURN json_build_object(
        'messages_deleted', msg_count,
        'voice_notes_deleted', voice_count,
        'voice_storage_paths', voice_paths,
        'images_deleted', image_count,
        'image_storage_paths', image_paths,
        'deleted_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON FUNCTION cleanup_old_messages IS 'Borra mensajes más antiguos que X días';
COMMENT ON FUNCTION cleanup_old_voice_notes IS 'Borra notas de voz más antiguas que X días y retorna las rutas de storage';
COMMENT ON FUNCTION cleanup_old_private_images IS 'Borra imágenes privadas más antiguas que X días y retorna las rutas de storage';
COMMENT ON FUNCTION cleanup_old_emotional_states IS 'Borra historial de estados emocionales más antiguos que X días';
COMMENT ON FUNCTION cleanup_all_old_data IS 'Ejecuta toda la limpieza automática de datos antiguos';
COMMENT ON FUNCTION delete_couple_history IS 'Borra TODO el historial de una pareja específica';

-- Verificar que las funciones se crearon correctamente
SELECT 
    routine_name as funcion,
    'Creada correctamente' as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%cleanup%' OR routine_name LIKE '%delete_couple%')
ORDER BY routine_name;

SELECT '✅ Migración de auto-cleanup aplicada correctamente' as resultado;
