-- ============================================
-- CONSULTA RÁPIDA: Verificar preferencias de género
-- ============================================

-- Ver distribución de preferencias de género
SELECT 
    looking_for_gender,
    COUNT(*) as total_usuarios,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_preferences), 2) as porcentaje
FROM public.user_preferences
GROUP BY looking_for_gender
ORDER BY total_usuarios DESC;

-- Ver todas las preferencias con detalle
SELECT 
    u.name,
    u.email,
    u.gender as mi_genero,
    up.looking_for_gender as busco_genero,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km,
    up.updated_at
FROM public.users u
JOIN public.user_preferences up ON u.id = up.user_id
ORDER BY up.updated_at DESC;

-- Verificar si hay preferencias NULL o inválidas
SELECT 
    COUNT(*) as total_preferencias,
    COUNT(CASE WHEN looking_for_gender IS NULL THEN 1 END) as sin_genero,
    COUNT(CASE WHEN looking_for_gender = 'any' THEN 1 END) as buscan_todos,
    COUNT(CASE WHEN looking_for_gender = 'male' THEN 1 END) as buscan_hombres,
    COUNT(CASE WHEN looking_for_gender = 'female' THEN 1 END) as buscan_mujeres
FROM public.user_preferences;
