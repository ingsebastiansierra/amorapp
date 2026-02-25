-- Actualizar políticas RLS para voice_notes para soportar conexiones

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can send voice notes to their partner" ON voice_notes;
DROP POLICY IF EXISTS "Users can view voice notes in their couple" ON voice_notes;
DROP POLICY IF EXISTS "Users can update their received voice notes" ON voice_notes;

-- Crear nuevas políticas basadas en from_user_id y to_user_id
CREATE POLICY "Users can insert voice notes"
ON voice_notes FOR INSERT
TO public
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view their voice notes"
ON voice_notes FOR SELECT
TO public
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can update received voice notes"
ON voice_notes FOR UPDATE
TO public
USING (auth.uid() = to_user_id);
