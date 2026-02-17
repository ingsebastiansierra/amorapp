-- ============================================
-- APLICAR PUSH TOKENS PARA NOTIFICACIONES
-- ============================================
-- Este script agrega los campos necesarios para
-- almacenar tokens de notificaciones push
-- ============================================

-- Agregar campos para push notifications
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP WITH TIME ZONE;

-- Índice para búsquedas rápidas de tokens
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN users.push_token IS 'Expo push notification token';
COMMENT ON COLUMN users.push_token_updated_at IS 'Última actualización del push token';

-- Verificar que se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('push_token', 'push_token_updated_at');

-- Mostrar usuarios con tokens (debería estar vacío inicialmente)
SELECT 
    id, 
    name, 
    email,
    push_token IS NOT NULL as has_token,
    push_token_updated_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
