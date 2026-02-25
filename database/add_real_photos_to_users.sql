-- ============================================
-- AGREGAR FOTOS REALES A USUARIOS
-- Usando randomuser.me para fotos reales según género
-- ============================================

-- Actualizar MUJERES con fotos reales
UPDATE public.users
SET avatar_url = CASE 
    WHEN name = 'María' THEN 'https://randomuser.me/api/portraits/women/1.jpg'
    WHEN name = 'Sofía' THEN 'https://randomuser.me/api/portraits/women/2.jpg'
    WHEN name = 'Ana' THEN 'https://randomuser.me/api/portraits/women/3.jpg'
    WHEN name = 'Lucía' THEN 'https://randomuser.me/api/portraits/women/4.jpg'
    WHEN name = 'Carmen' THEN 'https://randomuser.me/api/portraits/women/5.jpg'
    WHEN name = 'Elena' THEN 'https://randomuser.me/api/portraits/women/6.jpg'
    WHEN name = 'Paula' THEN 'https://randomuser.me/api/portraits/women/7.jpg'
    WHEN name = 'Diana' THEN 'https://randomuser.me/api/portraits/women/8.jpg'
    WHEN name = 'Isabel' THEN 'https://randomuser.me/api/portraits/women/9.jpg'
    WHEN name = 'Valeria' THEN 'https://randomuser.me/api/portraits/women/10.jpg'
    WHEN name = 'Natalia' THEN 'https://randomuser.me/api/portraits/women/11.jpg'
    WHEN name = 'Andrea' THEN 'https://randomuser.me/api/portraits/women/12.jpg'
    WHEN name = 'Gabriela' THEN 'https://randomuser.me/api/portraits/women/13.jpg'
    WHEN name = 'Fernanda' THEN 'https://randomuser.me/api/portraits/women/14.jpg'
    WHEN name = 'Daniela' THEN 'https://randomuser.me/api/portraits/women/15.jpg'
    WHEN name = 'Carolina' THEN 'https://randomuser.me/api/portraits/women/16.jpg'
    WHEN name = 'Laura' THEN 'https://randomuser.me/api/portraits/women/17.jpg'
    WHEN name = 'Mónica' THEN 'https://randomuser.me/api/portraits/women/18.jpg'
    WHEN name = 'Patricia' THEN 'https://randomuser.me/api/portraits/women/19.jpg'
    WHEN name = 'Verónica' THEN 'https://randomuser.me/api/portraits/women/20.jpg'
    WHEN name = 'Ximena Toba Siatama' THEN 'https://randomuser.me/api/portraits/women/21.jpg'
END
WHERE gender = 'female'
AND couple_id IS NULL;

-- Actualizar HOMBRES con fotos reales
UPDATE public.users
SET avatar_url = CASE 
    WHEN name = 'Carlos' THEN 'https://randomuser.me/api/portraits/men/1.jpg'
    WHEN name = 'Miguel' THEN 'https://randomuser.me/api/portraits/men/2.jpg'
    WHEN name = 'David' THEN 'https://randomuser.me/api/portraits/men/3.jpg'
    WHEN name = 'Jorge' THEN 'https://randomuser.me/api/portraits/men/4.jpg'
    WHEN name = 'Luis' THEN 'https://randomuser.me/api/portraits/men/5.jpg'
    WHEN name = 'Fernando' THEN 'https://randomuser.me/api/portraits/men/6.jpg'
    WHEN name = 'Ricardo' THEN 'https://randomuser.me/api/portraits/men/7.jpg'
    WHEN name = 'Alberto' THEN 'https://randomuser.me/api/portraits/men/8.jpg'
    WHEN name = 'Roberto' THEN 'https://randomuser.me/api/portraits/men/9.jpg'
    WHEN name = 'Eduardo' THEN 'https://randomuser.me/api/portraits/men/10.jpg'
    WHEN name = 'Javier' THEN 'https://randomuser.me/api/portraits/men/11.jpg'
    WHEN name = 'Daniel' THEN 'https://randomuser.me/api/portraits/men/12.jpg'
    WHEN name = 'Sergio' THEN 'https://randomuser.me/api/portraits/men/13.jpg'
    WHEN name = 'Pablo' THEN 'https://randomuser.me/api/portraits/men/14.jpg'
    WHEN name = 'Andrés' THEN 'https://randomuser.me/api/portraits/men/15.jpg'
    WHEN name = 'Raúl' THEN 'https://randomuser.me/api/portraits/men/16.jpg'
    WHEN name = 'Óscar' THEN 'https://randomuser.me/api/portraits/men/17.jpg'
    WHEN name = 'Manuel' THEN 'https://randomuser.me/api/portraits/men/18.jpg'
    WHEN name = 'Antonio' THEN 'https://randomuser.me/api/portraits/men/19.jpg'
    WHEN name = 'Francisco' THEN 'https://randomuser.me/api/portraits/men/20.jpg'
    WHEN name = 'Stiven ' THEN 'https://randomuser.me/api/portraits/men/21.jpg'
    WHEN name = 'Emanuel' THEN 'https://randomuser.me/api/portraits/men/22.jpg'
    WHEN name = 'Anuel' THEN 'https://randomuser.me/api/portraits/men/23.jpg'
    WHEN name = 'Sebastian Sierra Pineda' THEN 'https://randomuser.me/api/portraits/men/24.jpg'
END
WHERE gender = 'male'
AND couple_id IS NULL;

-- Verificar los cambios
SELECT 
    name,
    gender,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE '%randomuser%' THEN '✅ Foto real'
        ELSE '❌ Sin foto'
    END as estado
FROM public.users
WHERE couple_id IS NULL
ORDER BY gender, name;

-- Contar usuarios con fotos reales
SELECT 
    gender,
    COUNT(*) as total,
    COUNT(CASE WHEN avatar_url LIKE '%randomuser%' THEN 1 END) as con_foto_real
FROM public.users
WHERE couple_id IS NULL
GROUP BY gender;
