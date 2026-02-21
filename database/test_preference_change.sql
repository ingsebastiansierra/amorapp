-- ============================================
-- SCRIPT DE PRUEBA: Cambiar preferencias y verificar filtrado
-- Propósito: Simular cambio de preferencias desde la app
-- ============================================

-- ============================================
-- PASO 1: Seleccionar un usuario de prueba
-- ============================================

-- Ver usuarios disponibles para prueba
SELECT 
    id,
    name,
    email,
    gender
FROM public.users
WHERE couple_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- PASO 2: Cambiar preferencias a "solo mujeres"
-- ============================================

-- Reemplaza 'USER_ID_AQUI' con un ID real del paso anterior
-- Ejemplo: UPDATE para buscar solo mujeres

/*
UPDATE public.user_preferences
SET 
    looking_for_gender = 'female',
    age_range_min = 20,
    age_range_max = 30,
    distance_max_km = 100,
    updated_at = NOW()
WHERE user_id = 'USER_ID_AQUI';
*/

-- ============================================
-- PASO 3: Verificar el cambio
-- ============================================

-- Ver las preferencias actualizadas
/*
SELECT 
    u.name,
    u.gender as mi_genero,
    up.looking_for_gender as busco,
    up.age_range_min,
    up.age_range_max,
    up.distance_max_km,
    up.updated_at
FROM public.users u
JOIN public.user_preferences up ON u.id = up.user_id
WHERE u.id = 'USER_ID_AQUI';
*/

-- ============================================
-- PASO 4: Ver qué usuarios vería con el filtro
-- ============================================

-- Simular la query que hace la app en home.tsx
-- Reemplaza 'USER_ID_AQUI' con el mismo ID

/*
SELECT 
    u.id,
    u.name,
    u.gender,
    EXTRACT(YEAR FROM AGE(u.birth_date)) as edad,
    'Visible en Discovery' as estado
FROM public.users u
WHERE u.id != 'USER_ID_AQUI'
AND u.couple_id IS NULL
AND u.gender = 'female'  -- Filtro aplicado
AND EXTRACT(YEAR FROM AGE(u.birth_date)) BETWEEN 20 AND 30
ORDER BY u.name
LIMIT 20;
*/

-- ============================================
-- PASO 5: Comparar ANTES y DESPUÉS
-- ============================================

-- ANTES (sin filtro de género, solo solteros)
SELECT 
    'SIN FILTRO' as tipo,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN gender = 'male' THEN 1 END) as hombres,
    COUNT(CASE WHEN gender = 'female' THEN 1 END) as mujeres
FROM public.users
WHERE couple_id IS NULL;

-- DESPUÉS (con filtro: solo mujeres, 20-30 años)
SELECT 
    'CON FILTRO (female, 20-30)' as tipo,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN gender = 'male' THEN 1 END) as hombres,
    COUNT(CASE WHEN gender = 'female' THEN 1 END) as mujeres
FROM public.users
WHERE couple_id IS NULL
AND gender = 'female'
AND EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 20 AND 30;

-- ============================================
-- PASO 6: Prueba completa con diferentes filtros
-- ============================================

-- Filtro 1: Solo hombres
SELECT 
    'SOLO HOMBRES' as filtro,
    COUNT(*) as total
FROM public.users
WHERE couple_id IS NULL
AND gender = 'male';

-- Filtro 2: Solo mujeres
SELECT 
    'SOLO MUJERES' as filtro,
    COUNT(*) as total
FROM public.users
WHERE couple_id IS NULL
AND gender = 'female';

-- Filtro 3: Todos (any)
SELECT 
    'TODOS (ANY)' as filtro,
    COUNT(*) as total
FROM public.users
WHERE couple_id IS NULL;

-- ============================================
-- PASO 7: Restaurar a valor por defecto
-- ============================================

-- Si quieres volver a 'any' después de la prueba
/*
UPDATE public.user_preferences
SET 
    looking_for_gender = 'any',
    age_range_min = 18,
    age_range_max = 35,
    distance_max_km = 50,
    updated_at = NOW()
WHERE user_id = 'USER_ID_AQUI';
*/

-- ============================================
-- RESUMEN: Cómo probar desde la app
-- ============================================

/*
PASOS PARA PROBAR EN LA APP:

1. Abre la app y ve a Perfil
2. Toca "Preferencias de Búsqueda"
3. Cambia "Quiero conocer" de "Todos" a "Mujeres" o "Hombres"
4. Ajusta el rango de edad si quieres
5. Presiona "Guardar Cambios"
6. Vuelve a la pantalla de Inicio (Home)
7. Verifica que solo aparezcan usuarios del género seleccionado

Para verificar en la BD después del cambio:
- Ejecuta la primera consulta de este script
- Busca tu usuario y verifica que looking_for_gender cambió
*/
