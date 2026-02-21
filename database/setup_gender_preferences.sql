-- ============================================
-- SCRIPT: Configurar preferencias de género para Discovery
-- Propósito: Asegurar que todos los usuarios tengan preferencias definidas
-- ============================================

-- ============================================
-- 1. VERIFICAR PREFERENCIAS EXISTENTES
-- ============================================

-- Ver usuarios sin preferencias definidas
SELECT 
    u.id,
    u.name,
    u.gender,
    u.email,
    CASE 
        WHEN up.id IS NULL THEN 'Sin preferencias'
        ELSE 'Con preferencias'
    END as estado_preferencias
FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
WHERE up.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================
-- 2. CREAR PREFERENCIAS POR DEFECTO
-- ============================================

-- Insertar preferencias por defecto para usuarios que no las tienen
-- Por defecto: 'any' (mostrar ambos géneros)
INSERT INTO public.user_preferences (
    user_id,
    looking_for_gender,
    age_range_min,
    age_range_max,
    distance_max_km
)
SELECT 
    u.id,
    'any'::text,
    18,
    35,
    50
FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
WHERE up.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 3. VERIFICAR CONFIGURACIÓN FINAL
-- ============================================

-- Ver todas las preferencias de género configuradas
SELECT 
    u.id,
    u.name,
    u.gender as mi_genero,
    up.looking_for_gender as busco_genero,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km
FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
ORDER BY u.name;

-- ============================================
-- 4. ESTADÍSTICAS DE PREFERENCIAS
-- ============================================

-- Contar usuarios por preferencia de género
SELECT 
    looking_for_gender,
    COUNT(*) as total_usuarios,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_preferences), 2) as porcentaje
FROM public.user_preferences
GROUP BY looking_for_gender
ORDER BY total_usuarios DESC;

-- ============================================
-- 5. CONSULTA DE PRUEBA: DISCOVERY FILTRADO
-- ============================================

-- Ejemplo: Ver qué usuarios vería un usuario específico según sus preferencias
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario que quieres probar

/*
-- Descomentar y reemplazar USER_ID_AQUI para probar
DO $$
DECLARE
    test_user_id UUID := 'USER_ID_AQUI'; -- Reemplazar con ID real
    user_preference TEXT;
BEGIN
    -- Obtener preferencia del usuario
    SELECT looking_for_gender INTO user_preference
    FROM user_preferences
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Usuario busca: %', COALESCE(user_preference, 'any (por defecto)');
    
    -- Mostrar usuarios que vería
    RAISE NOTICE 'Usuarios que vería:';
    
    PERFORM u.name, u.gender
    FROM users u
    WHERE u.id != test_user_id
    AND u.couple_id IS NULL
    AND (
        user_preference = 'any' 
        OR user_preference IS NULL 
        OR u.gender = user_preference
    );
END $$;
*/
