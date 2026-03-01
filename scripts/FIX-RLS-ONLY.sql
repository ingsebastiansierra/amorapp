-- 🔧 ARREGLAR SOLO POLÍTICAS RLS
-- ⚠️ Este script NO elimina datos, solo arregla las políticas RLS
-- Ejecutar cuando tengas problemas de permisos pero NO quieras borrar usuarios

-- ========================================
-- ARREGLAR POLÍTICAS RLS DE USER_INTERESTS
-- ========================================

SELECT '🔧 Arreglando políticas de user_interests...' as paso;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can insert own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can update own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can delete own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Allow users to view own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Allow users to insert own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Allow users to update own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Allow users to delete own interests" ON public.user_interests;

-- Crear políticas correctas
CREATE POLICY "Allow users to view own interests" ON public.user_interests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own interests" ON public.user_interests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own interests" ON public.user_interests
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own interests" ON public.user_interests
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- ARREGLAR POLÍTICAS RLS DE USER_PREFERENCES
-- ========================================

SELECT '🔧 Arreglando políticas de user_preferences...' as paso;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow users to view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow users to insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow users to update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow users to delete own preferences" ON public.user_preferences;

-- Crear políticas correctas
CREATE POLICY "Allow users to view own preferences" ON public.user_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own preferences" ON public.user_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own preferences" ON public.user_preferences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own preferences" ON public.user_preferences
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- ARREGLAR POLÍTICAS RLS DE USER_INTENTIONS
-- ========================================

SELECT '🔧 Arreglando políticas de user_intentions...' as paso;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Users can insert own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Users can update own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Users can delete own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Allow users to view own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Allow users to insert own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Allow users to update own intentions" ON public.user_intentions;
DROP POLICY IF EXISTS "Allow users to delete own intentions" ON public.user_intentions;

-- Crear políticas correctas
CREATE POLICY "Allow users to view own intentions" ON public.user_intentions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own intentions" ON public.user_intentions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own intentions" ON public.user_intentions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own intentions" ON public.user_intentions
FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT '✅ VERIFICACIÓN DE POLÍTICAS' as paso;

-- Verificar políticas de user_interests
SELECT 'user_interests_policies' as tabla,
       COUNT(*) as total_policies,
       CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ INCOMPLETE' END as status
FROM pg_policies 
WHERE tablename = 'user_interests';

-- Verificar políticas de user_preferences
SELECT 'user_preferences_policies' as tabla,
       COUNT(*) as total_policies,
       CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ INCOMPLETE' END as status
FROM pg_policies 
WHERE tablename = 'user_preferences';

-- Verificar políticas de user_intentions
SELECT 'user_intentions_policies' as tabla,
       COUNT(*) as total_policies,
       CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ INCOMPLETE' END as status
FROM pg_policies 
WHERE tablename = 'user_intentions';

-- ========================================
-- RESULTADO
-- ========================================

SELECT '🎉 POLÍTICAS RLS ARREGLADAS' as resultado;
SELECT 'Los usuarios existentes NO fueron eliminados' as nota;
SELECT 'Ahora puedes guardar intereses, preferencias e intenciones' as instruccion;