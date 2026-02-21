-- ============================================
-- ACTUALIZAR EMAIL DE SEBASTIAN
-- ============================================

-- Ver datos actuales
SELECT 
    id,
    name,
    email,
    gender,
    created_at
FROM public.users
WHERE id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Actualizar el email
UPDATE public.users
SET email = 'vegasebastian073@gmail.com'
WHERE id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Verificar el cambio
SELECT 
    id,
    name,
    email,
    gender,
    created_at
FROM public.users
WHERE id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';

-- Verificar que coincida con auth.users
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    u.id as user_id,
    u.email as user_email,
    CASE 
        WHEN au.email = u.email THEN '✅ COINCIDEN'
        ELSE '❌ NO COINCIDEN'
    END as estado
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.id = '0fdfb754-b1a1-45d8-95f8-c00ffa4d028a';
