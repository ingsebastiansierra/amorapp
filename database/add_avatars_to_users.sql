-- ============================================
-- AGREGAR AVATARES AUTOMÁTICOS A TODOS LOS USUARIOS
-- ============================================

-- Actualizar usuarios sin avatar para que tengan uno generado automáticamente
UPDATE public.users
SET avatar_url = 'https://ui-avatars.com/api/?name=' || REPLACE(name, ' ', '+') || '&size=200&background=random'
WHERE avatar_url IS NULL
AND couple_id IS NULL;

-- Verificar los cambios
SELECT 
    id,
    name,
    gender,
    avatar_url,
    CASE 
        WHEN avatar_url IS NULL THEN '❌ Sin avatar'
        WHEN avatar_url LIKE 'http%' THEN '✅ Con avatar'
        ELSE '⚠️ Ruta relativa'
    END as estado
FROM public.users
WHERE couple_id IS NULL
ORDER BY name
LIMIT 20;

-- Contar usuarios con avatar
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(avatar_url) as con_avatar,
    COUNT(*) - COUNT(avatar_url) as sin_avatar
FROM public.users
WHERE couple_id IS NULL;
