-- Migración: Sistema de Notas de Voz Efímeras
-- Fecha: 2026-02-12

-- Tabla para notas de voz privadas
CREATE TABLE IF NOT EXISTS public.voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 30), -- máximo 30 segundos
    waveform_data JSONB, -- datos de la forma de onda para visualización
    listened BOOLEAN DEFAULT false,
    listened_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours') -- expira en 24h si no se escucha
);

-- Índices para performance
CREATE INDEX idx_voice_notes_to_user ON public.voice_notes(to_user_id, is_expired, created_at DESC);
CREATE INDEX idx_voice_notes_from_user ON public.voice_notes(from_user_id, created_at DESC);
CREATE INDEX idx_voice_notes_active ON public.voice_notes(to_user_id, listened, is_expired) 
    WHERE is_expired = false AND listened = false;

-- Habilitar RLS
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can send voice notes to their partner"
    ON public.voice_notes FOR INSERT
    WITH CHECK (
        auth.uid() = from_user_id
        AND EXISTS (
            SELECT 1 FROM public.couples
            WHERE (user1_id = auth.uid() AND user2_id = to_user_id)
               OR (user2_id = auth.uid() AND user1_id = to_user_id)
        )
    );

CREATE POLICY "Users can view voice notes sent to them"
    ON public.voice_notes FOR SELECT
    USING (
        auth.uid() = to_user_id
        OR auth.uid() = from_user_id
    );

CREATE POLICY "Users can update voice notes sent to them"
    ON public.voice_notes FOR UPDATE
    USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete their sent voice notes"
    ON public.voice_notes FOR DELETE
    USING (
        auth.uid() = from_user_id
        OR (auth.uid() = to_user_id AND listened = true)
    );

-- Función para marcar nota de voz como escuchada y expirarla
CREATE OR REPLACE FUNCTION mark_voice_note_listened(note_id UUID, listener_id UUID)
RETURNS json AS $$
BEGIN
    -- Verificar que el listener es el destinatario
    IF NOT EXISTS (
        SELECT 1 FROM public.voice_notes 
        WHERE id = note_id AND to_user_id = listener_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No autorizado para escuchar esta nota'
        );
    END IF;

    -- Marcar como escuchada y expirada (se autodestruye)
    UPDATE public.voice_notes
    SET 
        listened = true,
        listened_at = now(),
        is_expired = true
    WHERE id = note_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Nota escuchada y autodestruida'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para expirar notas antiguas (ejecutar con cron)
CREATE OR REPLACE FUNCTION expire_old_voice_notes()
RETURNS integer AS $$
DECLARE
    expired_count integer;
BEGIN
    UPDATE public.voice_notes
    SET is_expired = true
    WHERE expires_at < now() 
        AND is_expired = false;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificaciones en tiempo real
CREATE OR REPLACE FUNCTION notify_new_voice_note()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'new_voice_note',
        json_build_object(
            'note_id', NEW.id,
            'from_user_id', NEW.from_user_id,
            'to_user_id', NEW.to_user_id,
            'duration', NEW.duration,
            'created_at', NEW.created_at
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_voice_note
    AFTER INSERT ON public.voice_notes
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_voice_note();

-- Comentarios
COMMENT ON TABLE public.voice_notes IS 'Notas de voz efímeras que se autodestruyen después de escucharlas';
COMMENT ON COLUMN public.voice_notes.duration IS 'Duración en segundos (máximo 30)';
COMMENT ON COLUMN public.voice_notes.waveform_data IS 'Datos de la forma de onda para visualización animada';
COMMENT ON COLUMN public.voice_notes.listened IS 'Si la nota ya fue escuchada';
COMMENT ON COLUMN public.voice_notes.is_expired IS 'Si la nota expiró y se autodestruyó';
COMMENT ON FUNCTION mark_voice_note_listened IS 'Marca una nota como escuchada y la autodestruye';
COMMENT ON FUNCTION expire_old_voice_notes IS 'Expira notas que no fueron escuchadas en 24 horas';
