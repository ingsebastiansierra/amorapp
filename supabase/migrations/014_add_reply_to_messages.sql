-- Agregar columna para referencias de mensajes (respuestas)
-- Permite que un mensaje haga referencia a otro mensaje (como WhatsApp)

-- Agregar columna reply_to_message_id a sync_messages
ALTER TABLE sync_messages
ADD COLUMN reply_to_message_id UUID REFERENCES sync_messages(id) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_sync_messages_reply_to ON sync_messages(reply_to_message_id);

-- Comentarios para documentación
COMMENT ON COLUMN sync_messages.reply_to_message_id IS 'ID del mensaje al que se está respondiendo (null si no es una respuesta)';
