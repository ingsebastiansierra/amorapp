-- 🧹🧪 SCRIPT COMPLETO: LIMPIAR Y VERIFICAR PARA TESTING
-- ⚠️ Solo usar en desarrollo - Elimina TODOS los datos de usuarios
-- Ejecutar antes de probar el registro

-- ========================================
-- PASO 1: LIMPIEZA COMPLETA
-- ========================================

-- Eliminar datos en orden correcto (respetando foreign keys)
DELETE FROM public.messages;
DELETE FROM public.voice_notes;
DELETE FROM public.personal_gallery;
DELETE FROM public.images_private;
DELETE FROM public.user_intentions;
DELETE FROM public.user_interests;
DELETE FROM public.user_preferences;
DELETE FROM public.user_suggestions;
DELETE FROM public.matches;
DELETE FROM public.swipes;
DELETE FROM public.blocks;
DELETE FROM public.reports;
DELETE FROM public.gestures;
DELETE FROM public.heart_interactions;
DELETE FROM public.emotional_states;
DELETE FROM public.compatibility_cache;
DELETE FROM public.connections;
DELETE FROM public.couples;
DELETE FROM public.users;

-- Limpiar autenticación
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- Limpiar storage (NOTA: No se puede hacer con SQL directo)
-- Los archivos de storage se limpiarán automáticamente al eliminar usuarios
-- O se pueden limpiar manualmente desde el panel de Supabase Storage

-- ========================================
-- PASO 2: ARREGLAR POLÍTICAS RLS
-- ========================================

SELECT '🔧 ARREGLANDO POLÍTICAS RLS' as paso;

-- Eliminar políticas existentes de user_interests
DROP POLICY IF EXISTS "Users can view own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can insert own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can update own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can delete own interests" ON public.user_interests;

-- Crear políticas permisivas para user_interests
CREATE POLICY "Allow users to view own interests" ON public.user_interests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own interests" ON public.user_interests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own interests" ON public.user_interests
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own interests" ON public.user_interests
FOR DELETE USING (auth.uid() = user_id);

-- Eliminar políticas existentes de user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

-- Crear políticas permisivas para user_preferences
CREATE POLICY "Allow users to view own preferences" ON public.user_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own preferences" ON public.user_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own preferences" ON public.user_preferences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own preferences" ON public.user_preferences
FOR DELETE USING (auth.uid() = user_id);

-- Eliminar políticas existentes de user_intentions
DROP POLICY IF EXISTS "Users can view own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Users can insert own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Users can update own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Users can delete own intentions" ON public.user_intentions;

-- Crear políticas permisivas para user_intentions
CREATE POLICY "Allow users to view own intentions" ON public.user_intentions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own intentions" ON public.user_intentions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own intentions" ON public.user_intentions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own intentions" ON public.user_intentions
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- PASO 3: VERIFICACIÓN DE LIMPIEZA
-- ========================================

SELECT '🧹 VERIFICACIÓN DE LIMPIEZA' as paso;

SELECT 'users' as tabla, COUNT(*) as registros FROM public.users
UNION ALL
SELECT 'auth.users' as tabla, COUNT(*) as registros FROM auth.users
UNION ALL
SELECT 'auth.identities' as tabla, COUNT(*) as registros FROM auth.identities
UNION ALL
SELECT 'connections' as tabla, COUNT(*) as registros FROM public.connections
UNION ALL
SELECT 'messages' as tabla, COUNT(*) as registros FROM public.messages
UNION ALL
SELECT 'storage.objects' as tabla, COUNT(*) as registros FROM storage.objects;

-- ========================================
-- PASO 4: VERIFICACIÓN DE CONFIGURACIÓN
-- ========================================

SELECT '⚙️ VERIFICACIÓN DE CONFIGURACIÓN' as paso;

-- Verificar tabla users existe
SELECT 'users_table' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- Verificar columnas críticas de users
SELECT 'users_columns' as check_type,
       CASE WHEN COUNT(*) >= 15 THEN '✅ OK' ELSE '❌ INCOMPLETE' END as result
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

-- Verificar bucket avatars
SELECT 'avatars_bucket' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- Verificar políticas de avatars
SELECT 'avatars_policies' as check_type,
       CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ INCOMPLETE' END as result
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE 'avatars_%';

-- Verificar RLS en tabla users
SELECT 'users_rls' as check_type,
       CASE WHEN COUNT(*) > 0 THEN '✅ ENABLED' ELSE '⚠️ DISABLED' END as result
FROM pg_policies 
WHERE tablename = 'users';

-- Verificar políticas de user_interests
SELECT 'user_interests_policies' as check_type,
       CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ INCOMPLETE' END as result
FROM pg_policies 
WHERE tablename = 'user_interests';

-- Verificar políticas de user_preferences
SELECT 'user_preferences_policies' as check_type,
       CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ INCOMPLETE' END as result
FROM pg_policies 
WHERE tablename = 'user_preferences';

-- ========================================
-- PASO 5: DIAGNÓSTICO DE REGISTRO
-- ========================================

SELECT '🔍 DIAGNÓSTICO PARA REGISTRO' as paso;

-- Verificar estructura de tabla users (columnas críticas)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
AND column_name IN ('id', 'email', 'name', 'gender', 'birth_date', 'avatar_url', 'created_at')
ORDER BY column_name;

-- Verificar triggers en users
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- ========================================
-- RESULTADO FINAL
-- ========================================

SELECT '🎯 RESULTADO FINAL' as paso;
SELECT 'BASE DE DATOS LIMPIA Y LISTA PARA PROBAR REGISTRO' as status;
SELECT 'Políticas RLS arregladas para user_interests, user_preferences y user_intentions' as rls_status;
SELECT 'Ahora puedes probar el registro en la app' as instruccion;
SELECT 'NOTA: Los archivos de storage se pueden limpiar manualmente desde el panel de Supabase' as storage_info;