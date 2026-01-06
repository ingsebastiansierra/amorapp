-- Crear usuario para CorazonMelon@gmail.com
-- Ejecuta esto en el SQL Editor de Supabase

-- Primero, inserta el usuario en auth.users (Supabase lo hace automáticamente con signUp)
-- Pero podemos crear el perfil directamente

-- Nota: Para crear el usuario, es mejor usar la interfaz de Supabase:
-- 1. Ve a Authentication → Users
-- 2. Click en "Add user"
-- 3. Email: CorazonMelon@gmail.com
-- 4. Password: xime20020903
-- 5. Auto Confirm User: YES (marca esta opción)
-- 6. Click "Create user"

-- Después de crear el usuario, ejecuta esto para agregar el perfil:
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario que se creó

INSERT INTO public.users (id, email, name, gender, created_at)
VALUES (
  'USER_ID_AQUI', -- Reemplaza con el UUID del usuario creado
  'CorazonMelon@gmail.com',
  'Ximena',
  'female',
  NOW()
);
