-- Tabla para mensajes sincronizados (solo cuando ambos tienen la misma emoción)
CREATE TABLE IF NOT EXISTS public.sync_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (char_length(message) <= 50),
    synced_emotion TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_sync_messages_couple ON public.sync_messages(couple_id);
CREATE INDEX idx_sync_messages_to_user ON public.sync_messages(to_user_id);
CREATE INDEX idx_sync_messages_created ON public.sync_messages(created_at DESC);

-- RLS
ALTER TABLE public.sync_messages ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can send sync messages to their partner"
  ON public.sync_messages FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    AND couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can view sync messages in their couple"
  ON public.sync_messages FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages sent to them"
  ON public.sync_messages FOR UPDATE
  USING (auth.uid() = to_user_id);
