-- ============================================
-- SCRIPT DE PRUEBA: Filtrado por Género en Discovery
-- Propósito: Probar diferentes escenarios de filtrado
-- ============================================

-- ============================================
-- ESCENARIO 1: Usuario busca solo MUJERES
-- ============================================

-- Simular: Usuario con ID específico busca solo mujeres
SELECT 
    u.id,
    u.name,
    u.gender,
    u.email,
    'Visible para usuarios que buscan mujeres' as nota
FROM public.users u
WHERE u.gender = 'female'
AND u.couple_id IS NULL
ORDER BY u.name
LIMIT 10;

-- ============================================
-- ESCENARIO 2: Usuario busca solo HOMBRES
-- ============================================

-- Simular: Usuario con ID específico busca solo hombres
SELECT 
    u.id,
    u.name,
    u.gender,
    u.email,
    'Visible para usuarios que buscan hombres' as nota
FROM public.users u
WHERE u.gender = 'male'
AND u.couple_id IS NULL
ORDER BY u.name
LIMIT 10;

-- ============================================
-- ESCENARIO 3: Usuario busca AMBOS géneros (ANY)
-- ============================================

-- Simular: Usuario con ID específico busca cualquier género
SELECT 
    u.id,
    u.name,
    u.gender,
    u.email,
    'Visible para usuarios que buscan cualquier género' as nota
FROM public.users u
WHERE u.couple_id IS NULL
ORDER BY u.name
LIMIT 20;

-- ============================================
-- ESCENARIO 4: Estadísticas de disponibilidad
-- ============================================

-- Ver cuántos usuarios hay disponibles por género
SELECT 
    gender,
    COUNT(*) as usuarios_disponibles,
    COUNT(*) FILTER (WHERE couple_id IS NULL) as solteros,
    COUNT(*) FILTER (WHERE couple_id IS NOT NULL) as en_pareja
FROM public.users
GROUP BY gender
ORDER BY gender;

-- ============================================
-- ESCENARIO 5: Simulación completa de Discovery
-- ============================================

-- Función para simular lo que vería un usuario específico
-- Reemplaza los valores de ejemplo con IDs reales

DO $$
DECLARE
    -- Variables de prueba (reemplazar con valores reales)
    test_user_id UUID := '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a'; -- Sebastian
    test_preference TEXT := 'female'; -- Cambiar a 'male', 'female' o 'any'
    
    user_count INTEGER;
BEGIN
    -- Contar usuarios que vería
    SELECT COUNT(*) INTO user_count
    FROM users u
    WHERE u.id != test_user_id
    AND u.couple_id IS NULL
    AND (
        test_preference = 'any' 
        OR u.gender = test_preference
    );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SIMULACIÓN DE DISCOVERY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuario ID: %', test_user_id;
    RAISE NOTICE 'Preferencia: %', test_preference;
    RAISE NOTICE 'Usuarios visibles: %', user_count;
    RAISE NOTICE '========================================';
END $$;

-- Ver los primeros 10 usuarios que vería
SELECT 
    u.id,
    u.name,
    u.gender,
    EXTRACT(YEAR FROM AGE(u.birth_date)) as edad,
    'Visible en Discovery' as estado
FROM users u
WHERE u.id != '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a' -- Reemplazar con ID real
AND u.couple_id IS NULL
AND (
    'female' = 'any'  -- Reemplazar 'female' con preferencia deseada
    OR u.gender = 'female'
)
ORDER BY RANDOM()
LIMIT 10;
