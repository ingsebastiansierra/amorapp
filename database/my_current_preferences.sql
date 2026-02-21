-- Ver MIS preferencias actuales
SELECT 
    u.name as mi_nombre,
    u.email as mi_email,
    u.gender as mi_genero,
    up.looking_for_gender as busco_genero,
    up.age_range_min as edad_minima,
    up.age_range_max as edad_maxima,
    up.distance_max_km as distancia_maxima_km,
    up.created_at as creado_el,
    up.updated_at as actualizado_el,
    CASE 
        WHEN up.looking_for_gender = 'male' THEN '👨 Solo Hombres'
        WHEN up.looking_for_gender = 'female' THEN '👩 Solo Mujeres'
        WHEN up.looking_for_gender = 'any' THEN '👥 Todos'
        ELSE 'No definido'
    END as preferencia_legible
FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
WHERE u.email = 'vegasebastian073@gmail.com';
