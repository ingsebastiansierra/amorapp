-- Agregar campo para rastrear el último cambio de nombre
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name_change TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- NO actualizar registros existentes, dejarlos en NULL
-- Esto permite que los usuarios puedan cambiar su nombre la primera vez sin restricción
