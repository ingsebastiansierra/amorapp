-- Ver las preferencias más recientes (últimos cambios)
SELECT 
    u.name,
    u.email,
    u.gender as mi_genero,
    up.looking_for_gender as busco_genero,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km,
    up.updated_at,
    NOW() - up.updated_at as hace_cuanto
FROM public.users u
JOIN public.user_preferences up ON u.id = up.user_id
ORDER BY up.updated_at DESC
LIMIT 10;
