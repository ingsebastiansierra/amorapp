-- ============================================
-- POLÍTICAS DE STORAGE PARA NOTAS DE VOZ
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- PASO 1: Crear el bucket 'voice-notes' en Storage (privado)
-- Ve a Storage > Create bucket > Nombre: voice-notes > Public: NO

-- PASO 2: Aplicar estas políticas

-- 1. Política: Los usuarios pueden subir a su propia carpeta
DROP POLICY IF EXISTS "Users can upload voice notes" ON storage.objects;
CREATE POLICY "Users can upload voice notes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Política: Los usuarios pueden ver sus propias notas
DROP POLICY IF EXISTS "Users can view their own voice notes" ON storage.objects;
CREATE POLICY "Users can view their own voice notes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Política: Los destinatarios pueden ver notas enviadas a ellos
DROP POLICY IF EXISTS "Recipients can view voice notes sent to them" ON storage.objects;
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

-- 4. Política: Los usuarios pueden eliminar sus propias notas
DROP POLICY IF EXISTS "Users can delete their voice notes" ON storage.objects;
CREATE POLICY "Users can delete their voice notes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política: Los destinatarios pueden eliminar notas escuchadas
DROP POLICY IF EXISTS "Recipients can delete listened voice notes" ON storage.objects;
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
-- Verificar políticas creadas
-- ============================================
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%voice%';

-- ============================================
-- ¡LISTO!
-- ============================================
