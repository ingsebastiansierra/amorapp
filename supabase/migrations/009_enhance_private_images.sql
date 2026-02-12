-- Migración: Mejorar sistema de imágenes privadas para "ver una vez"
-- Fecha: 2026-02-11

-- Agregar nuevas columnas a images_private
ALTER TABLE public.images_private
  ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  ADD COLUMN IF NOT EXISTS thumbnail_path text,
  ADD COLUMN IF NOT EXISTS caption text CHECK (char_length(caption) <= 200),
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_views integer DEFAULT 1, -- 1 = ver una vez, NULL = ilimitado
  ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_expired boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS file_size bigint,
  ADD COLUMN IF NOT EXISTS duration integer; -- duración en segundos para videos

-- Actualizar registros existentes
UPDATE public.images_private
SET 
  is_expired = viewed,
  view_count = CASE WHEN viewed THEN 1 ELSE 0 END,
  viewed_at = CASE WHEN viewed THEN created_at + interval '1 minute' ELSE NULL END
WHERE viewed IS NOT NULL;

-- Crear índice para consultas rápidas de contenido no expirado
CREATE INDEX IF NOT EXISTS idx_images_private_active 
  ON public.images_private(to_user_id, is_expired, created_at DESC) 
  WHERE is_expired = false;

-- Crear índice para consultas por pareja
CREATE INDEX IF NOT EXISTS idx_images_private_users 
  ON public.images_private(from_user_id, to_user_id, created_at DESC);

-- Función para marcar imagen como vista y expirar si alcanzó el límite
CREATE OR REPLACE FUNCTION mark_private_image_viewed(image_id uuid, viewer_id uuid)
RETURNS json AS $$
DECLARE
  result json;
  current_views integer;
  max_allowed integer;
BEGIN
  -- Verificar que el viewer es el destinatario
  IF NOT EXISTS (
    SELECT 1 FROM public.images_private 
    WHERE id = image_id AND to_user_id = viewer_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No autorizado para ver esta imagen'
    );
  END IF;

  -- Incrementar contador y obtener valores
  UPDATE public.images_private
  SET 
    view_count = view_count + 1,
    viewed = true,
    viewed_at = CASE WHEN viewed_at IS NULL THEN now() ELSE viewed_at END
  WHERE id = image_id
  RETURNING view_count, max_views INTO current_views, max_allowed;

  -- Verificar si debe expirar
  IF max_allowed IS NOT NULL AND current_views >= max_allowed THEN
    UPDATE public.images_private
    SET is_expired = true
    WHERE id = image_id;
    
    result := json_build_object(
      'success', true,
      'expired', true,
      'message', 'Imagen vista y expirada'
    );
  ELSE
    result := json_build_object(
      'success', true,
      'expired', false,
      'views_remaining', max_allowed - current_views
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para expirar imágenes por tiempo
CREATE OR REPLACE FUNCTION expire_old_private_images()
RETURNS integer AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.images_private
  SET is_expired = true
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_expired = false;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON COLUMN public.images_private.media_type IS 'Tipo de medio: photo o video';
COMMENT ON COLUMN public.images_private.max_views IS 'Máximo de vistas permitidas. 1 = ver una vez, NULL = ilimitado';
COMMENT ON COLUMN public.images_private.view_count IS 'Número de veces que se ha visto';
COMMENT ON COLUMN public.images_private.is_expired IS 'Si la imagen ya expiró y no se puede ver más';
COMMENT ON COLUMN public.images_private.caption IS 'Texto opcional que acompaña la imagen (máx 200 caracteres)';
COMMENT ON COLUMN public.images_private.duration IS 'Duración en segundos (solo para videos)';

COMMENT ON FUNCTION mark_private_image_viewed IS 'Marca una imagen como vista e incrementa el contador. Expira automáticamente si alcanza max_views';
COMMENT ON FUNCTION expire_old_private_images IS 'Expira imágenes que superaron su tiempo límite. Retorna cantidad de imágenes expiradas';
