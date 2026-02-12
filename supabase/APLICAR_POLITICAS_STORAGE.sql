-- ============================================
-- POLÍTICAS DE SEGURIDAD PARA STORAGE
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Política: Los usuarios pueden subir a su propia carpeta
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
CREATE POLICY "Users can upload to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'private-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Política: Los usuarios pueden ver sus propias imágenes
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
CREATE POLICY "Users can view their own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Política: Los destinatarios pueden ver imágenes enviadas a ellos
DROP POLICY IF EXISTS "Recipients can view images sent to them" ON storage.objects;
CREATE POLICY "Recipients can view images sent to them"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-images'
  AND EXISTS (
    SELECT 1 FROM public.images_private
    WHERE storage_path = name
    AND to_user_id = auth.uid()
  )
);

-- 4. Política: Los usuarios pueden eliminar sus propias imágenes
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'private-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política: Los destinatarios pueden eliminar imágenes vistas (para autodestrucción)
DROP POLICY IF EXISTS "Recipients can delete viewed images" ON storage.objects;
CREATE POLICY "Recipients can delete viewed images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'private-images'
  AND EXISTS (
    SELECT 1 FROM public.images_private
    WHERE storage_path = name
    AND to_user_id = auth.uid()
    AND viewed = true
  )
);

-- ============================================
-- Verificar políticas creadas
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%private-images%' OR policyname LIKE '%Users can%' OR policyname LIKE '%Recipients%';

-- ============================================
-- ¡LISTO!
-- ============================================
