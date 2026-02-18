-- Crear bucket para galería personal
-- Ejecutar en el SQL Editor de Supabase

-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('personal-gallery', 'personal-gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Partners can view visible photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to personal-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view personal-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from personal-gallery" ON storage.objects;

-- Política: Cualquier usuario autenticado puede subir a su carpeta
CREATE POLICY "Anyone can upload to personal-gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal-gallery'
);

-- Política: Cualquiera puede ver fotos (el control de visibilidad está en la tabla)
CREATE POLICY "Anyone can view personal-gallery"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'personal-gallery');

-- Política: Los usuarios pueden eliminar sus propias fotos
CREATE POLICY "Users can delete from personal-gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'personal-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verificar que el bucket se creó correctamente
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'personal-gallery';

-- Verificar políticas
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%personal-gallery%';
