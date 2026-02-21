-- Buscar usuarios con emails similares
SELECT 
    id,
    name,
    email,
    gender,
    created_at
FROM public.users
WHERE email ILIKE '%sebastian%'
   OR email ILIKE '%vega%'
   OR name ILIKE '%sebastian%'
ORDER BY created_at DESC;

-- Ver todos los usuarios recientes (últimos 10)
SELECT 
    id,
    name,
    email,
    gender,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Buscar en auth.users también
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE email ILIKE '%sebastian%'
   OR email ILIKE '%vega%'
ORDER BY created_at DESC;
