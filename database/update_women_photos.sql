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
WHERE gender = 'female';
