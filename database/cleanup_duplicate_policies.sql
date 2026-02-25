-- EJECUTAR ESTE SQL EN SUPABASE SQL EDITOR
-- Limpiar políticas duplicadas de sync_messages

-- Eliminar políticas antiguas duplicadas
DROP POLICY IF EXISTS "Users can send sync messages to their partner" ON sync_messages;
DROP POLICY IF EXISTS "Users can update messages sent to them" ON sync_messages;
DROP POLICY IF EXISTS "Users can view sync messages in their couple" ON sync_messages;

-- Verificar que solo queden las políticas correctas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sync_messages'
ORDER BY cmd, policyname;
