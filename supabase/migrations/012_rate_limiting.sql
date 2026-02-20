    -- Migración: Rate Limiting para prevenir spam
    -- Fecha: 2026-02-20
    -- Descripción: Limita la cantidad de acciones que un usuario puede hacer en un período de tiempo

    -- 1. Limitar mensajes sincronizados (máximo 10 por minuto)
    CREATE OR REPLACE FUNCTION check_sync_message_rate_limit()
    RETURNS TRIGGER AS $$
    BEGIN
    IF (
        SELECT COUNT(*)
        FROM sync_messages
        WHERE from_user_id = NEW.from_user_id
        AND created_at > NOW() - INTERVAL '1 minute'
    ) >= 10 THEN
        RAISE EXCEPTION 'Demasiados mensajes. Espera un momento.';
    END IF;
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER sync_message_rate_limit
    BEFORE INSERT ON sync_messages
    FOR EACH ROW
    EXECUTE FUNCTION check_sync_message_rate_limit();

    -- 2. Limitar cambios de estado emocional (máximo 20 por hora)
    CREATE OR REPLACE FUNCTION check_emotional_state_rate_limit()
    RETURNS TRIGGER AS $$
    BEGIN
    IF (
        SELECT COUNT(*)
        FROM emotional_states
        WHERE user_id = NEW.user_id
        AND created_at > NOW() - INTERVAL '1 hour'
    ) >= 20 THEN
        RAISE EXCEPTION 'Demasiados cambios de estado. Espera un momento.';
    END IF;
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER emotional_state_rate_limit
    BEFORE INSERT ON emotional_states
    FOR EACH ROW
    EXECUTE FUNCTION check_emotional_state_rate_limit();

    -- 3. Limitar subida de imágenes (máximo 20 por hora)
    CREATE OR REPLACE FUNCTION check_image_upload_rate_limit()
    RETURNS TRIGGER AS $$
    BEGIN
    IF (
        SELECT COUNT(*)
        FROM images_private
        WHERE from_user_id = NEW.from_user_id
        AND created_at > NOW() - INTERVAL '1 hour'
    ) >= 20 THEN
        RAISE EXCEPTION 'Demasiadas imágenes. Espera un momento.';
    END IF;
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER image_upload_rate_limit
    BEFORE INSERT ON images_private
    FOR EACH ROW
    EXECUTE FUNCTION check_image_upload_rate_limit();

    -- 4. Limitar notas de voz (máximo 15 por hora)
    CREATE OR REPLACE FUNCTION check_voice_note_rate_limit()
    RETURNS TRIGGER AS $$
    BEGIN
    IF (
        SELECT COUNT(*)
        FROM voice_notes
        WHERE from_user_id = NEW.from_user_id
        AND created_at > NOW() - INTERVAL '1 hour'
    ) >= 15 THEN
        RAISE EXCEPTION 'Demasiadas notas de voz. Espera un momento.';
    END IF;
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER voice_note_rate_limit
    BEFORE INSERT ON voice_notes
    FOR EACH ROW
    EXECUTE FUNCTION check_voice_note_rate_limit();

    -- Comentarios
    COMMENT ON FUNCTION check_sync_message_rate_limit() IS 'Limita mensajes sincronizados a 10 por minuto';
    COMMENT ON FUNCTION check_emotional_state_rate_limit() IS 'Limita cambios de estado a 20 por hora';
    COMMENT ON FUNCTION check_image_upload_rate_limit() IS 'Limita subida de imágenes a 20 por hora';
    COMMENT ON FUNCTION check_voice_note_rate_limit() IS 'Limita notas de voz a 15 por hora';
