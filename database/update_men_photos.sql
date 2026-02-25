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
WHERE gender = 'male';
