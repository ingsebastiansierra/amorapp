-- Ver usuarios y sus avatares
SELECT 
    id,
    name,
    email,
    gender,
    avatar_url,
    CASE 
        WHEN avatar_url IS NULL THEN '❌ Sin avatar'
        WHEN avatar_url LIKE 'http%' THEN '✅ URL completa'
        ELSE '⚠️ Ruta relativa'
    END as estado_avatar
FROM public.users
WHERE couple_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- Contar usuarios con y sin avatar
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(avatar_url) as con_avatar,
    COUNT(*) - COUNT(avatar_url) as sin_avatar
FROM public.users
WHERE couple_id IS NULL;
