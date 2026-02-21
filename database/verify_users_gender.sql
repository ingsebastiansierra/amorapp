-- ============================================
-- CONSULTA: Verificar nombres y género de usuarios
-- Propósito: Revisar que los datos de usuarios estén correctos
-- ============================================

-- Consulta básica: Ver todos los usuarios con nombre y género
SELECT 
    id,
    name,
    gender,
    email,
    birth_date,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Consulta con estadísticas por género
SELECT 
    gender,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN couple_id IS NOT NULL THEN 1 END) as usuarios_en_pareja,
    COUNT(CASE WHEN couple_id IS NULL THEN 1 END) as usuarios_solteros
FROM public.users
GROUP BY gender
ORDER BY gender;

-- Consulta para verificar usuarios sin género definido
SELECT 
    id,
    name,
    email,
    gender,
    created_at
FROM public.users
WHERE gender IS NULL
ORDER BY created_at DESC;

-- Consulta detallada: Usuarios con información completa
SELECT 
    u.id,
    u.name,
    u.gender,
    u.email,
    u.birth_date,
    CASE 
        WHEN u.couple_id IS NOT NULL THEN 'En pareja'
        ELSE 'Soltero/a'
    END as estado_relacion,
    u.created_at,
    u.last_seen
FROM public.users u
ORDER BY u.created_at DESC;
