-- Migración: Optimización para mensajes en tiempo real
-- Fecha: 2026-02-20
-- Descripción: Mejora el rendimiento de las suscripciones en tiempo real y consultas de mensajes

-- 0. Eliminar constraint antiguo de 50 caracteres y agregar nuevo de 500
ALTER TABLE public.sync_messages DROP CONSTRAINT IF EXISTS sync_messages_message_check;
ALTER TABLE public.sync_messages ADD CONSTRAINT sync_messages_message_check CHECK (char_length(message) <= 500 AND char_length(message) >= 1);

-- 1. Agregar índice compuesto para consultas de mensajes por pareja y fecha
CREATE INDEX IF NOT EXISTS idx_sync_messages_couple_created 
ON public.sync_messages(couple_id, created_at DESC);

-- 2. Agregar índice para consultas de mensajes no leídos
CREATE INDEX IF NOT EXISTS idx_sync_messages_unread 
ON public.sync_messages(to_user_id, read) 
WHERE read = false;

-- 3. Agregar índice para mensajes con respuestas
CREATE INDEX IF NOT EXISTS idx_sync_messages_reply 
ON public.sync_messages(reply_to_message_id) 
WHERE reply_to_message_id IS NOT NULL;

-- 4. Función para notificar cambios en tiempo real (trigger mejorado)
CREATE OR REPLACE FUNCTION notify_message_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar solo al destinatario del mensaje
    PERFORM pg_notify(
        'message_changes',
        json_build_object(
            'operation', TG_OP,
            'record', row_to_json(NEW),
            'to_user_id', NEW.to_user_id
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para notificaciones en tiempo real
DROP TRIGGER IF EXISTS sync_messages_notify_trigger ON public.sync_messages;
CREATE TRIGGER sync_messages_notify_trigger
AFTER INSERT OR UPDATE ON public.sync_messages
FOR EACH ROW
EXECUTE FUNCTION notify_message_change();

-- 6. Mejorar el rate limiting para ser más flexible
DROP TRIGGER IF EXISTS sync_message_rate_limit ON public.sync_messages;
DROP FUNCTION IF EXISTS check_sync_message_rate_limit();

CREATE OR REPLACE FUNCTION check_sync_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    message_count INTEGER;
BEGIN
    -- Contar mensajes en el último minuto
    SELECT COUNT(*)
    INTO message_count
    FROM sync_messages
    WHERE from_user_id = NEW.from_user_id
    AND created_at > NOW() - INTERVAL '1 minute';
    
    -- Permitir hasta 20 mensajes por minuto (aumentado de 10)
    IF message_count >= 20 THEN
        RAISE EXCEPTION 'Demasiados mensajes. Espera un momento.'
            USING HINT = 'Límite: 20 mensajes por minuto';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_message_rate_limit
BEFORE INSERT ON sync_messages
FOR EACH ROW
EXECUTE FUNCTION check_sync_message_rate_limit();

-- 7. Agregar función para limpiar mensajes antiguos de manera eficiente
DROP FUNCTION IF EXISTS cleanup_old_messages(INTEGER);

CREATE FUNCTION cleanup_old_messages(days_to_keep INTEGER DEFAULT 7)
RETURNS TABLE(deleted_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH deleted AS (
        DELETE FROM sync_messages
        WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
        RETURNING *
    )
    SELECT COUNT(*)::BIGINT FROM deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Comentarios para documentación
COMMENT ON INDEX idx_sync_messages_couple_created IS 'Optimiza consultas de mensajes por pareja ordenados por fecha';
COMMENT ON INDEX idx_sync_messages_unread IS 'Optimiza consultas de mensajes no leídos por usuario';
COMMENT ON INDEX idx_sync_messages_reply IS 'Optimiza consultas de mensajes con respuestas';
COMMENT ON FUNCTION notify_message_change() IS 'Notifica cambios en mensajes para suscripciones en tiempo real';
COMMENT ON FUNCTION check_sync_message_rate_limit() IS 'Previene spam limitando a 20 mensajes por minuto';
COMMENT ON FUNCTION cleanup_old_messages(INTEGER) IS 'Limpia mensajes antiguos de manera eficiente';
