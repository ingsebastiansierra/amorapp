-- EJECUTAR ESTE SQL EN SUPABASE SQL EDITOR
-- Actualizar tabla sync_messages para funcionar con conexiones individuales

-- Hacer couple_id opcional
ALTER TABLE sync_messages ALTER COLUMN couple_id DROP NOT NULL;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view their couple messages" ON sync_messages;
DROP POLICY IF EXISTS "Users can insert messages to their couple" ON sync_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON sync_messages;

-- Crear nuevas políticas que funcionen con o sin couple_id
CREATE POLICY "Users can view their messages"
ON sync_messages FOR SELECT
USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id
);

CREATE POLICY "Users can insert messages"
ON sync_messages FOR INSERT
WITH CHECK (
    auth.uid() = from_user_id
);

CREATE POLICY "Users can update their received messages"
ON sync_messages FOR UPDATE
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sync_messages_users 
ON sync_messages(from_user_id, to_user_id);

CREATE INDEX IF NOT EXISTS idx_sync_messages_created 
ON sync_messages(created_at DESC);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sync_messages';
