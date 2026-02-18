-- Migración: Sistema de galería personal con control de visibilidad
-- Fecha: 2026-02-18
-- Descripción: Permite a los usuarios subir fotos personales y controlar si son visibles para su pareja

-- Crear tabla de galería personal
CREATE TABLE IF NOT EXISTS public.personal_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  thumbnail_path text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'visible')),
  caption text CHECK (char_length(caption) <= 500),
  file_size bigint,
  width integer,
  height integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_personal_gallery_user ON public.personal_gallery(user_id, created_at DESC);
CREATE INDEX idx_personal_gallery_visibility ON public.personal_gallery(user_id, visibility, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.personal_gallery ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias fotos
CREATE POLICY "Users can view own gallery"
  ON public.personal_gallery
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias fotos
CREATE POLICY "Users can insert own photos"
  ON public.personal_gallery
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias fotos
CREATE POLICY "Users can update own photos"
  ON public.personal_gallery
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias fotos
CREATE POLICY "Users can delete own photos"
  ON public.personal_gallery
  FOR DELETE
  USING (auth.uid() = user_id);

-- Política: La pareja puede ver fotos marcadas como 'visible'
CREATE POLICY "Partners can view visible photos"
  ON public.personal_gallery
  FOR SELECT
  USING (
    visibility = 'visible' AND
    EXISTS (
      SELECT 1 FROM public.couples c
      INNER JOIN public.users u1 ON u1.id = auth.uid()
      INNER JOIN public.users u2 ON u2.id = user_id
      WHERE u1.couple_id = c.id 
        AND u2.couple_id = c.id
        AND u1.id != u2.id
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_personal_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_personal_gallery_timestamp
  BEFORE UPDATE ON public.personal_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_gallery_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.personal_gallery IS 'Galería personal de fotos con control de visibilidad para la pareja';
COMMENT ON COLUMN public.personal_gallery.visibility IS 'Visibilidad de la foto: private (solo yo) o visible (pareja puede ver)';
COMMENT ON COLUMN public.personal_gallery.caption IS 'Descripción opcional de la foto (máx 500 caracteres)';
