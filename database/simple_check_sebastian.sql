-- 1. Usuario básico
SELECT * FROM public.users WHERE id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- 2. Preferencias (LO MÁS IMPORTANTE)
SELECT * FROM public.user_preferences WHERE user_id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- 3. Si no tiene preferencias, crearlas
INSERT INTO public.user_preferences (
    user_id,
    looking_for_gender,
    age_range_min,
    age_range_max,
    distance_max_km
)
VALUES (
    '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a',
    'any',
    18,
    35,
    50
)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Verificar de nuevo
SELECT 
    looking_for_gender,
    age_range_min,
    age_range_max,
    distance_max_km,
    created_at,
    updated_at
FROM public.user_preferences 
WHERE user_id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';
