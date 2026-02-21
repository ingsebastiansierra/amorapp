-- ============================================
-- VERIFICAR PERFIL COMPLETO DE SEBASTIAN
-- ============================================

-- Usuario en public.users
SELECT 
    id,
    name,
    email,
    gender,
    birth_date,
    couple_id,
    created_at
FROM public.users
WHERE id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Preferencias del usuario
SELECT 
    user_id,
    looking_for_gender,
    age_range_min,
    age_range_max,
    distance_max_km,
    created_at,
    updated_at
FROM public.user_preferences
WHERE user_id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Intereses del usuario
SELECT *
FROM public.user_interests
WHERE user_id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Intenciones del usuario
SELECT 
    user_id,
    intention_type,
    activity,
    is_active,
    created_at,
    updated_at
FROM public.user_intentions
WHERE user_id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- RESUMEN COMPLETO
SELECT 
    u.name,
    u.email,
    u.gender,
    up.looking_for_gender,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km,
    CASE 
        WHEN up.looking_for_gender = 'male' THEN '👨 Solo Hombres'
        WHEN up.looking_for_gender = 'female' THEN '👩 Solo Mujeres'
        WHEN up.looking_for_gender = 'any' THEN '👥 Todos'
        ELSE '❌ Sin preferencias'
    END as preferencia,
    CASE WHEN up.id IS NULL THEN '❌ NO' ELSE '✅ SI' END as tiene_preferencias,
    CASE WHEN ui.id IS NULL THEN '❌ NO' ELSE '✅ SI' END as tiene_intereses,
    CASE WHEN uint.id IS NULL THEN '❌ NO' ELSE '✅ SI' END as tiene_intencion
FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
LEFT JOIN public.user_interests ui ON u.id = ui.user_id
LEFT JOIN public.user_intentions uint ON u.id = uint.user_id
WHERE u.id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';
