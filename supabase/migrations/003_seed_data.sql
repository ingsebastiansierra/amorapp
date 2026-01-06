-- Insertar retos diarios de ejemplo
-- Este script es OPCIONAL, puedes ejecutarlo después de crear las tablas

-- Retos emocionales
INSERT INTO public.challenges (title, description, category, is_premium) VALUES
('Dile algo bonito', 'Envía un mensaje diciéndole algo que normalmente no dices', 'emotional', false),
('Recuerda un momento especial', 'Comparte un recuerdo bonito que tengan juntos', 'emotional', false),
('Hazle sentir especial', 'Haz algo hoy que le haga sentir que piensas en ella/él', 'emotional', false),
('Pregunta sobre su día', 'Pregúntale cómo se siente realmente hoy', 'emotional', false),
('Comparte una foto', 'Envía una foto de algo que te recordó a ella/él', 'emotional', false);

-- Retos comunicativos
INSERT INTO public.challenges (title, description, category, is_premium) VALUES
('Cuenta algo nuevo', 'Comparte algo sobre ti que no sepa', 'communication', false),
('Escucha activamente', 'Hoy solo escucha, sin interrumpir ni dar consejos', 'communication', false),
('Expresa gratitud', 'Dile 3 cosas por las que estás agradecido/a', 'communication', false),
('Habla del futuro', 'Comparte algo que quieras hacer juntos próximamente', 'communication', false),
('Pregunta profunda', '¿Qué es lo que más valoras de nuestra relación?', 'communication', false);

-- Retos picantes (premium)
INSERT INTO public.challenges (title, description, category, is_premium) VALUES
('Envía algo atrevido', 'Sorpréndele con algo que no espera', 'spicy', true),
('Planea una sorpresa', 'Organiza algo especial para cuando se vean', 'spicy', true),
('Juego de seducción', 'Envía pistas durante el día sobre lo que planeas', 'spicy', true),
('Confesión picante', 'Cuéntale una fantasía que tengas', 'spicy', true),
('Reto atrevido', 'Proponle algo nuevo que quieras probar juntos', 'spicy', true);

-- Retos de conexión
INSERT INTO public.challenges (title, description, category, is_premium) VALUES
('Sincroniza estados', 'Intenten estar en el mismo estado emocional hoy', 'connection', false),
('Envía corazones', 'Envía al menos 5 corazones durante el día', 'connection', false),
('Responde rápido', 'Responde a sus gestos en menos de 5 minutos', 'connection', false),
('Mantén el streak', 'No dejen que se rompa la racha de días conectados', 'connection', false),
('Sorpresa aleatoria', 'Envía un gesto cuando menos lo espere', 'connection', false);
