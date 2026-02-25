-- Buscar información de Patricia
SELECT 
    u.id,
    u.name,
    u.email,
    u.gender,
    u.birth_date,
    EXTRACT(YEAR FROM AGE(u.birth_date)) as edad,
    u.created_at
FROM public.users u
WHERE u.name ILIKE '%patricia%'
AND u.gender = 'female';

-- Ver si existe en auth.users
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at
FROM auth.users au
WHERE au.email IN (
    SELECT email FROM public.users WHERE name ILIKE '%patricia%'
);
