-- ============================================
-- POLÍTICAS DE STORAGE PARA AVATARES
-- ============================================
-- Este archivo contiene las políticas de seguridad para el bucket de avatares
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- 1. Crear bucket para avatares si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- 3. Crear nuevas políticas

-- Permitir a usuarios autenticados subir su propio avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir a usuarios autenticados actualizar su propio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir a usuarios autenticados eliminar su propio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir a todos ver los avatares (público)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Verificar que las políticas se aplicaron
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%';
