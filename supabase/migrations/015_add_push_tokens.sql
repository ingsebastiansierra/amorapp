-- Agregar campos para push notifications
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP WITH TIME ZONE;

-- Índice para búsquedas rápidas de tokens
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN users.push_token IS 'Expo push notification token';
COMMENT ON COLUMN users.push_token_updated_at IS 'Última actualización del push token';
