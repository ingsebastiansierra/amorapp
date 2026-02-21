-- Migración: Sistema de Sugerencias y Feedback
-- Fecha: 2026-02-20
-- Descripción: Tabla para recopilar sugerencias de usuarios

CREATE TABLE IF NOT EXISTS public.user_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type = ANY (ARRAY['feature'::text, 'bug'::text, 'improvement'::text, 'other'::text])),
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 100),
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 1000),
    status TEXT DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'planned'::text, 'implemented'::text, 'rejected'::text])),
    priority INTEGER DEFAULT 0,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_suggestions_user ON public.user_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON public.user_suggestions(status);
CREATE INDEX idx_suggestions_type ON public.user_suggestions(suggestion_type);
CREATE INDEX idx_suggestions_created ON public.user_suggestions(created_at DESC);

-- RLS
ALTER TABLE public.user_suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can create their own suggestions"
  ON public.user_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own suggestions"
  ON public.user_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending suggestions"
  ON public.user_suggestions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suggestions_updated_at
BEFORE UPDATE ON public.user_suggestions
FOR EACH ROW
EXECUTE FUNCTION update_suggestions_updated_at();

-- Rate limiting para sugerencias (máximo 5 por día)
CREATE OR REPLACE FUNCTION check_suggestion_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM user_suggestions
        WHERE user_id = NEW.user_id
        AND created_at > NOW() - INTERVAL '24 hours'
    ) >= 5 THEN
        RAISE EXCEPTION 'Has alcanzado el límite de 5 sugerencias por día. Intenta mañana.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suggestion_rate_limit
BEFORE INSERT ON user_suggestions
FOR EACH ROW
EXECUTE FUNCTION check_suggestion_rate_limit();

-- Comentarios
COMMENT ON TABLE public.user_suggestions IS 'Sugerencias y feedback de usuarios';
COMMENT ON COLUMN public.user_suggestions.suggestion_type IS 'Tipo: feature, bug, improvement, other';
COMMENT ON COLUMN public.user_suggestions.status IS 'Estado: pending, reviewing, planned, implemented, rejected';
COMMENT ON COLUMN public.user_suggestions.priority IS 'Prioridad asignada por admin (0-10)';
