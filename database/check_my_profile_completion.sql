-- ============================================
-- VERIFICAR PERFIL COMPLETO DE vegasebastian073@gmail.com
-- ============================================

-- ============================================
-- 1. INFORMACIÓN BÁSICA DEL USUARIO
-- ============================================

SELECT 
    u.id,
    u.name,
    u.email,
    u.gender,
    u.birth_date,
    EXTRACT(YEAR FROM AGE(u.birth_date)) as edad,
    u.avatar_url,
    u.couple_id,
    CASE WHEN u.couple_id IS NULL THEN 'Soltero' ELSE 'En pareja' END as estado,
    u.created_at
FROM public.users u
WHERE u.email = 'vegasebastian073@gmail.com';

-- ============================================
-- 2. INTENCIONES (Cuestionario de intención)
-- ============================================

SELECT 
    ui.intention_type,
    ui.activity,
    ui.availability,
    ui.is_active,
    ui.created_at,
    ui.updated_at,
    CASE WHEN ui.id IS NULL THEN '❌ NO COMPLETADO' ELSE '✅ COMPLETADO' END as estado
FROM public.users u
LEFT JOIN public.user_intentions ui ON u.id = ui.user_id
WHERE u.email = 'vegasebastian073@gmail.com';

-- ============================================
-- 3. INTERESES (Cuestionarios de música, deportes, etc.)
-- ============================================

SELECT 
    -- Música
    ui.music_favorite_genre,
    ui.music_favorite_artist,
    ui.music_concert_frequency,
    
    -- Deportes
    ui.sports_favorite_sport,
    ui.sports_practice_frequency,
    ui.sports_favorite_team,
    
    -- Entretenimiento
    ui.entertainment_favorite_movie_genre,
    ui.entertainment_favorite_series,
    ui.entertainment_hobbies,
    
    -- Comida
    ui.food_favorite_food,
    ui.food_dietary_preference,
    ui.food_cooking_frequency,
    
    -- Estilo de vida
    ui.lifestyle_favorite_color,
    ui.lifestyle_personality_type,
    ui.lifestyle_ideal_date,
    
    -- Estado
    ui.profile_completed,
    ui.created_at,
    ui.updated_at,
    
    CASE WHEN ui.id IS NULL THEN '❌ NO COMPLETADO' ELSE '✅ COMPLETADO' END as estado
FROM public.users u
LEFT JOIN public.user_interests ui ON u.id = ui.user_id
WHERE u.email = 'vegasebastian073@gmail.com';

-- ============================================
-- 4. PREFERENCIAS (Cuestionario de preferencias de búsqueda)
-- ============================================

SELECT 
    up.looking_for_gender,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km,
    up.show_location,
    up.show_last_seen,
    up.show_age,
    up.notifications_new_matches,
    up.notifications_messages,
    up.created_at,
    up.updated_at,
    CASE WHEN up.id IS NULL THEN '❌ NO COMPLETADO' ELSE '✅ COMPLETADO' END as estado
FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
WHERE u.email = 'vegasebastian073@gmail.com';

-- ============================================
-- 5. RESUMEN GENERAL
-- ============================================

SELECT 
    u.name,
    u.email,
    CASE WHEN ui.id IS NOT NULL THEN '✅' ELSE '❌' END as tiene_intencion,
    CASE WHEN uint.id IS NOT NULL THEN '✅' ELSE '❌' END as tiene_intereses,
    CASE WHEN uint.profile_completed THEN '✅' ELSE '❌' END as perfil_completado,
    CASE WHEN up.id IS NOT NULL THEN '✅' ELSE '❌' END as tiene_preferencias,
    CASE 
        WHEN ui.id IS NOT NULL 
        AND uint.id IS NOT NULL 
        AND uint.profile_completed 
        AND up.id IS NOT NULL 
        THEN '✅ PERFIL 100% COMPLETO'
        ELSE '⚠️ PERFIL INCOMPLETO'
    END as estado_general
FROM public.users u
LEFT JOIN public.user_intentions ui ON u.id = ui.user_id
LEFT JOIN public.user_interests uint ON u.id = uint.user_id
LEFT JOIN public.user_preferences up ON u.id = up.user_id
WHERE u.email = 'vegasebastian073@gmail.com';

-- ============================================
-- 6. CAMPOS FALTANTES EN INTERESES
-- ============================================

SELECT 
    u.name,
    CASE WHEN ui.music_favorite_genre IS NULL THEN '❌ Música' ELSE '✅ Música' END as musica,
    CASE WHEN ui.sports_favorite_sport IS NULL THEN '❌ Deportes' ELSE '✅ Deportes' END as deportes,
    CASE WHEN ui.entertainment_favorite_movie_genre IS NULL THEN '❌ Entretenimiento' ELSE '✅ Entretenimiento' END as entretenimiento,
    CASE WHEN ui.food_favorite_food IS NULL THEN '❌ Comida' ELSE '✅ Comida' END as comida,
    CASE WHEN ui.lifestyle_favorite_color IS NULL THEN '❌ Estilo de vida' ELSE '✅ Estilo de vida' END as estilo_vida
FROM public.users u
LEFT JOIN public.user_interests ui ON u.id = ui.user_id
WHERE u.email = 'vegasebastian073@gmail.com';
