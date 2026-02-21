-- ============================================
-- PROBAR ACTUALIZACIÓN MANUAL DE PREFERENCIAS
-- ============================================

-- Ver preferencias actuales
SELECT 
    user_id,
    looking_for_gender,
    age_range_min,
    age_range_max,
    distance_max_km,
    updated_at
FROM public.user_preferences 
WHERE user_id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Intentar actualizar a "solo mujeres"
UPDATE public.user_preferences
SET 
    looking_for_gender = 'female',
    age_range_min = 20,
    age_range_max = 30,
    distance_max_km = 100,
    updated_at = NOW()
WHERE user_id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Verificar el cambio
SELECT 
    user_id,
    looking_for_gender,
    age_range_min,
    age_range_max,
    distance_max_km,
    updated_at,
    CASE 
        WHEN looking_for_gender = 'male' THEN '👨 Solo Hombres'
        WHEN looking_for_gender = 'female' THEN '👩 Solo Mujeres'
        WHEN looking_for_gender = 'any' THEN '👥 Todos'
    END as preferencia_legible
FROM public.user_preferences 
WHERE user_id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Ver qué usuarios verías ahora (solo mujeres, 20-30 años)
SELECT 
    u.id,
    u.name,
    u.gender,
    EXTRACT(YEAR FROM AGE(u.birth_date)) as edad,
    'Visible con filtro aplicado' as estado
FROM public.users u
WHERE u.id != '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a'
AND u.couple_id IS NULL
AND u.gender = 'female'
AND EXTRACT(YEAR FROM AGE(u.birth_date)) BETWEEN 20 AND 30
ORDER BY u.name
LIMIT 10;
