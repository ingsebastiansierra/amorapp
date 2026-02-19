-- Tabla para eventos/citas de la pareja
CREATE TABLE IF NOT EXISTS couple_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('anniversary', 'date', 'movie', 'special', 'other')),
    location TEXT,
    reminder_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_couple_events_couple_id ON couple_events(couple_id);
CREATE INDEX idx_couple_events_date ON couple_events(event_date);

-- RLS Policies
ALTER TABLE couple_events ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver eventos de su pareja
CREATE POLICY "Users can view their couple events"
    ON couple_events FOR SELECT
    USING (
        couple_id IN (
            SELECT couple_id FROM users WHERE id = auth.uid()
        )
    );

-- Los usuarios pueden crear eventos para su pareja
CREATE POLICY "Users can create couple events"
    ON couple_events FOR INSERT
    WITH CHECK (
        couple_id IN (
            SELECT couple_id FROM users WHERE id = auth.uid()
        )
    );

-- Los usuarios pueden actualizar eventos de su pareja
CREATE POLICY "Users can update couple events"
    ON couple_events FOR UPDATE
    USING (
        couple_id IN (
            SELECT couple_id FROM users WHERE id = auth.uid()
        )
    );

-- Los usuarios pueden eliminar eventos que crearon
CREATE POLICY "Users can delete their own events"
    ON couple_events FOR DELETE
    USING (created_by = auth.uid());
