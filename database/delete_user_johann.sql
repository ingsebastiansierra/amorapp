-- ============================================
-- ELIMINAR USUARIO: johannsierra2401@gmail.com
-- ============================================

-- PASO 1: Verificar que el usuario existe
SELECT 
    u.id,
    u.name,
    u.email,
    u.couple_id,
    CASE WHEN u.couple_id IS NULL THEN '✅ Soltero - Seguro eliminar' ELSE '⚠️ En pareja - Verificar' END as estado
FROM public.users u
WHERE u.email = 'johannsierra2401@gmail.com';

-- PASO 2: Ver datos relacionados que se eliminarán (CASCADE)
-- Preferencias
SELECT 'Preferencias' as tabla, COUNT(*) as registros
FROM public.user_preferences
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'johannsierra2401@gmail.com')

UNION ALL

-- Intereses
SELECT 'Intereses' as tabla, COUNT(*) as registros
FROM public.user_interests
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'johannsierra2401@gmail.com')

UNION ALL

-- Intenciones
SELECT 'Intenciones' as tabla, COUNT(*) as registros
FROM public.user_intentions
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'johannsierra2401@gmail.com')

UNION ALL

-- Conexiones
SELECT 'Conexiones' as tabla, COUNT(*) as registros
FROM public.connections
WHERE user1_id IN (SELECT id FROM public.users WHERE email = 'johannsierra2401@gmail.com')
   OR user2_id IN (SELECT id FROM public.users WHERE email = 'johannsierra2401@gmail.com');

-- PASO 3: Eliminar de public.users (esto eliminará automáticamente los datos relacionados por CASCADE)
DELETE FROM public.users
WHERE email = 'johannsierra2401@gmail.com';

-- PASO 4: Eliminar de auth.users (tabla de autenticación)
DELETE FROM auth.users
WHERE email = 'johannsierra2401@gmail.com';

-- PASO 5: Verificar que se eliminó correctamente
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Usuario eliminado correctamente de public.users'
        ELSE '❌ Error: Usuario aún existe en public.users'
    END as resultado
FROM public.users
WHERE email = 'johannsierra2401@gmail.com';

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Usuario eliminado correctamente de auth.users'
        ELSE '❌ Error: Usuario aún existe en auth.users'
    END as resultado
FROM auth.users
WHERE email = 'johannsierra2401@gmail.com';
