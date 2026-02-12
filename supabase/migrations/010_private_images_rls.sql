-- Migración: Mejoras de seguridad para imágenes privadas
-- Fecha: 2026-02-11

-- Nota: RLS ya está habilitado y las políticas básicas ya existen en 002_rls_policies.sql
-- Solo agregamos la política de DELETE que faltaba

-- Política: Los usuarios pueden eliminar imágenes que enviaron
DROP POLICY IF EXISTS "Users can delete images they sent" ON public.images_private;
CREATE POLICY "Users can delete images they sent"
  ON public.images_private
  FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);


-- Crear trigger para notificar en tiempo real cuando llega una imagen nueva
DROP TRIGGER IF EXISTS trigger_notify_new_private_image ON public.images_private;
DROP FUNCTION IF EXISTS notify_new_private_image();

CREATE OR REPLACE FUNCTION notify_new_private_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificación en tiempo real para el receptor
  PERFORM pg_notify(
    'new_private_image',
    json_build_object(
      'image_id', NEW.id,
      'from_user_id', NEW.from_user_id,
      'to_user_id', NEW.to_user_id,
      'media_type', NEW.media_type,
      'max_views', NEW.max_views,
      'caption', NEW.caption,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_private_image
  AFTER INSERT ON public.images_private
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_private_image();

-- Comentarios
COMMENT ON POLICY "Users can delete images they sent" ON public.images_private 
  IS 'Permite al remitente eliminar imágenes que envió';
COMMENT ON FUNCTION notify_new_private_image() 
  IS 'Notifica en tiempo real cuando se recibe una nueva imagen privada';
