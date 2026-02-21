-- ============================================
-- PASO 1: Verificar si el usuario existe
-- ============================================

SELECT 
    id,
    name,
    email,
    gender,
    birth_date
FROM public.users
WHERE email = 'vegasebastian073@gmail.com';

-- ============================================
-- PASO 2: Verificar si tiene preferencias
-- ============================================

SELECT 
    up.*
FROM public.user_preferences up
JOIN public.users u ON up.user_id = u.id
WHERE u.email = 'vegasebastian073@gmail.com';

-- ============================================
-- PASO 3: Crear preferencias si no existen
-- ============================================

-- Insertar preferencias por defecto para tu usuario
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
WHERE u.email = 'vegasebastian073@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_preferences up WHERE up.user_id = u.id
);

-- ============================================
-- PASO 4: Verificar que se crearon
-- ============================================

SELECT 
    u.name,
    u.email,
    u.gender as mi_genero,
    up.looking_for_gender as busco_genero,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km,
    up.created_at,
    up.updated_at
FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
WHERE u.email = 'vegasebastian073@gmail.com';
