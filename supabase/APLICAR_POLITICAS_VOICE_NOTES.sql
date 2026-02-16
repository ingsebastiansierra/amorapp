-- ============================================
-- POLÍTICAS DE STORAGE PARA VOICE NOTES
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- IMPORTANTE: Primero verifica que el bucket 'voice-notes' existe
-- Si no existe, créalo en Storage UI: Nombre: voice-notes, Public: NO

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Recipients can view voice notes sent to them" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Recipients can delete listened voice notes" ON storage.objects;

-- 1. UPLOAD: Los usuarios pueden subir a su propia carpeta
CREATE POLICY "Users can upload voice notes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. SELECT: Los usuarios pueden ver sus propias notas
CREATE POLICY "Users can view their own voice notes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. SELECT: Los destinatarios pueden ver notas enviadas a ellos
CREATE POLICY "Recipients can view voice notes sent to them"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND EXISTS (
        SELECT 1 FROM public.voice_notes
        WHERE storage_path = name
        AND to_user_id = auth.uid()
        AND is_expired = false
    )
);

-- 4. DELETE: Los usuarios pueden eliminar sus propias notas
CREATE POLICY "Users can delete their voice notes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. DELETE: Los destinatarios pueden eliminar notas escuchadas
CREATE POLICY "Recipients can delete listened voice notes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND EXISTS (
        SELECT 1 FROM public.voice_notes
        WHERE storage_path = name
        AND to_user_id = auth.uid()
        AND listened = true
    )
);

-- ============================================
-- VERIFICAR POLÍTICAS CREADAS
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'INSERT' THEN 'Subir archivos'
        WHEN cmd = 'SELECT' THEN 'Ver archivos'
        WHEN cmd = 'DELETE' THEN 'Eliminar archivos'
        ELSE cmd
    END as accion
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%voice%'
ORDER BY cmd, policyname;

-- Deberías ver 5 políticas:
-- 1. DELETE - Recipients can delete listened voice notes
-- 2. DELETE - Users can delete their voice notes
-- 3. INSERT - Users can upload voice notes
-- 4. SELECT - Recipients can view voice notes sent to them
-- 5. SELECT - Users can view their own voice notes

-- ============================================
-- PRUEBA DE FUNCIONAMIENTO
-- ============================================
-- Después de aplicar las políticas, prueba:
-- 1. Enviar una nota de voz desde la app
-- 2. Escucharla completamente
-- 3. Verificar en Storage que se eliminó automáticamente
-- 4. Revisar logs en la consola de la app:
--    - 🗑️ Intentando eliminar nota de voz
--    - ✅ Archivo eliminado de storage
--    - ✅ Registro eliminado de BD
