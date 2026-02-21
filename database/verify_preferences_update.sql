-- ============================================
-- SCRIPT: Verificar actualización de preferencias
-- Propósito: Probar que las preferencias se actualicen correctamente
-- ============================================

-- ============================================
-- 1. VER PREFERENCIAS ACTUALES
-- ============================================

-- Ver todas las preferencias con información del usuario
SELECT 
    u.id,
    u.name,
    u.email,
    u.gender as mi_genero,
    up.looking_for_gender as busco,
    up.age_range_min as edad_min,
    up.age_range_max as edad_max,
    up.distance_max_km as distancia_km,
    up.updated_at as ultima_actualizacion
FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
ORDER BY up.updated_at DESC NULLS LAST;

-- ============================================
-- 2. VERIFICAR POLÍTICAS RLS
-- ============================================

-- Ver políticas activas en user_preferences
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_preferences'
ORDER BY policyname;

-- ============================================
-- 3. PROBAR ACTUALIZACIÓN (Ejemplo)
-- ============================================

-- Ejemplo de actualización de preferencias
-- Reemplaza 'USER_ID_AQUI' con un ID real de usuario

/*
-- Actualizar preferencias de un usuario específico
UPDATE public.user_preferences
SET 
    looking_for_gender = 'female',
    age_range_min = 20,
    age_range_max = 30,
    distance_max_km = 100,
    updated_at = NOW()
WHERE user_id = 'USER_ID_AQUI';

-- Verificar el cambio
SELECT 
    u.name,
    up.looking_for_gender,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km,
    up.updated_at
FROM public.users u
JOIN public.user_preferences up ON u.id = up.user_id
WHERE u.id = 'USER_ID_AQUI';
*/

-- ============================================
-- 4. VERIFICAR USUARIOS QUE VERÍA DESPUÉS DEL CAMBIO
-- ============================================

-- Simular qué usuarios vería un usuario después de cambiar preferencias
-- Reemplaza los valores con los de prueba

DO $$
DECLARE
    test_user_id UUID := '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a'; -- Reemplazar
    test_looking_for TEXT := 'female'; -- Reemplazar con 'male', 'female' o 'any'
    test_age_min INTEGER := 20;
    test_age_max INTEGER := 30;
    user_count INTEGER;
BEGIN
    -- Contar usuarios que vería con las nuevas preferencias
    SELECT COUNT(*) INTO user_count
    FROM users u
    WHERE u.id != test_user_id
    AND u.couple_id IS NULL
    AND (
        test_looking_for = 'any' 
        OR u.gender = test_looking_for
    )
    AND EXTRACT(YEAR FROM AGE(u.birth_date)) BETWEEN test_age_min AND test_age_max;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SIMULACIÓN DE FILTROS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuario ID: %', test_user_id;
    RAISE NOTICE 'Busca género: %', test_looking_for;
    RAISE NOTICE 'Edad: % - % años', test_age_min, test_age_max;
    RAISE NOTICE 'Usuarios que vería: %', user_count;
    RAISE NOTICE '========================================';
END $$;

-- Ver los primeros 10 usuarios que vería con los filtros
SELECT 
    u.id,
    u.name,
    u.gender,
    EXTRACT(YEAR FROM AGE(u.birth_date)) as edad,
    'Visible con filtros aplicados' as estado
FROM users u
WHERE u.id != '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a' -- Reemplazar
AND u.couple_id IS NULL
AND (
    'female' = 'any'  -- Reemplazar con preferencia
    OR u.gender = 'female'
)
AND EXTRACT(YEAR FROM AGE(u.birth_date)) BETWEEN 20 AND 30 -- Reemplazar rangos
ORDER BY RANDOM()
LIMIT 10;

-- ============================================
-- 5. HISTORIAL DE CAMBIOS
-- ============================================

-- Ver los últimos cambios de preferencias (últimas 24 horas)
SELECT 
    u.name,
    u.email,
    up.looking_for_gender,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km,
    up.updated_at,
    NOW() - up.updated_at as tiempo_desde_cambio
FROM public.user_preferences up
JOIN public.users u ON up.user_id = u.id
WHERE up.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY up.updated_at DESC;

-- ============================================
-- 6. ESTADÍSTICAS DE PREFERENCIAS
-- ============================================

-- Distribución de preferencias de género
SELECT 
    looking_for_gender,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_preferences), 2) as porcentaje
FROM public.user_preferences
GROUP BY looking_for_gender
ORDER BY total DESC;

-- Rangos de edad más comunes
SELECT 
    age_range_min,
    age_range_max,
    COUNT(*) as usuarios
FROM public.user_preferences
GROUP BY age_range_min, age_range_max
ORDER BY usuarios DESC
LIMIT 10;

-- Distancias más comunes
SELECT 
    distance_max_km,
    COUNT(*) as usuarios
FROM public.user_preferences
GROUP BY distance_max_km
ORDER BY usuarios DESC
LIMIT 10;
