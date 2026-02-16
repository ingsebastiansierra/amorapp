-- ============================================
-- RESETEAR CAMPO last_name_change
-- ============================================
-- Este script resetea el campo last_name_change a NULL para todos los usuarios
-- Esto les permite cambiar su nombre por primera vez sin restricción
-- EJECUTAR SOLO UNA VEZ

-- Resetear el campo para todos los usuarios
UPDATE users 
SET last_name_change = NULL;

-- Verificar que se aplicó correctamente
SELECT id, name, last_name_change 
FROM users 
LIMIT 10;

-- Deberías ver que last_name_change es NULL para todos los usuarios
