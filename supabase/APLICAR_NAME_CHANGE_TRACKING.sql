-- ============================================
-- AGREGAR CAMPO PARA RASTREAR CAMBIOS DE NOMBRE
-- ============================================
-- Este archivo agrega el campo last_name_change a la tabla users
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- 1. Agregar campo para rastrear el último cambio de nombre
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name_change TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. NO actualizar registros existentes
-- Los usuarios podrán cambiar su nombre la primera vez sin restricción
-- La restricción de 60 días se activará después del primer cambio

-- 3. Si quieres resetear el campo para usuarios que ya lo tienen (OPCIONAL)
-- Descomenta la siguiente línea solo si quieres dar a todos una oportunidad de cambio
-- UPDATE users SET last_name_change = NULL;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verificar que el campo se agregó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'last_name_change';

-- Ver algunos registros de ejemplo
SELECT id, name, last_name_change, created_at 
FROM users 
LIMIT 5;
