-- Migración: Validación de Datos
-- Fecha: 2026-02-20
-- Descripción: Agrega constraints para validar datos en la base de datos

-- 1. Validar longitud de mensajes sincronizados (se maneja en 015_optimize_realtime_messages.sql)
-- NOTA: El constraint de longitud de mensajes se actualiza en la migración 015

-- 2. Validar longitud de nombres de usuario
ALTER TABLE users
ADD CONSTRAINT name_length CHECK (LENGTH(name) BETWEEN 1 AND 100);

-- 3. Validar formato de email (si no existe ya)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_format'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- 4. Validar longitud de títulos de eventos (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couple_events') THEN
    ALTER TABLE couple_events
    ADD CONSTRAINT event_title_length CHECK (LENGTH(title) BETWEEN 1 AND 100);
    
    ALTER TABLE couple_events
    ADD CONSTRAINT event_description_length CHECK (
      description IS NULL OR LENGTH(description) <= 500
    );
    
    ALTER TABLE couple_events
    ADD CONSTRAINT event_location_length CHECK (
      location IS NULL OR LENGTH(location) <= 200
    );
  END IF;
END $$;

-- 5. Validar longitud de descripciones de imágenes
ALTER TABLE images_private
ADD CONSTRAINT image_caption_length CHECK (
  caption IS NULL OR LENGTH(caption) <= 200
);

-- Comentarios
COMMENT ON CONSTRAINT message_length ON sync_messages IS 'Mensajes entre 1 y 500 caracteres';
COMMENT ON CONSTRAINT name_length ON users IS 'Nombres entre 1 y 100 caracteres';
COMMENT ON CONSTRAINT image_caption_length ON images_private IS 'Descripciones hasta 200 caracteres';
