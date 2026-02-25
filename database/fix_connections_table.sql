-- ============================================
-- ARREGLAR TABLA CONNECTIONS
-- ============================================

-- Eliminar el trigger que causa problemas
DROP TRIGGER IF EXISTS trigger_update_connections_updated_at ON public.connections;

-- Eliminar la función del trigger
DROP FUNCTION IF EXISTS update_connections_updated_at();

-- Verificar la estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'connections' 
AND table_schema = 'public';

-- Agregar la columna updated_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'connections' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.connections 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Crear la función del trigger
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_update_connections_updated_at ON public.connections;
CREATE TRIGGER trigger_update_connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connections_updated_at();

-- Verificar que todo esté correcto
SELECT 
    'Tabla connections configurada correctamente' as status,
    COUNT(*) as total_connections
FROM public.connections;
