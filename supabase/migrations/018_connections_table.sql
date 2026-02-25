-- ============================================
-- TABLA DE CONEXIONES/SOLICITUDES DE AMISTAD
-- ============================================

-- Crear tabla de conexiones (solo si no existe)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    initiated_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'rejected')),
    initial_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar constraints solo si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_connection'
    ) THEN
        ALTER TABLE public.connections ADD CONSTRAINT unique_connection UNIQUE (user1_id, user2_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_self_connection'
    ) THEN
        ALTER TABLE public.connections ADD CONSTRAINT no_self_connection CHECK (user1_id != user2_id);
    END IF;
END $$;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_connections_user1 ON public.connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON public.connections(user2_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_pending ON public.connections(user2_id, status) WHERE status = 'pending';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_connections_updated_at ON public.connections;
CREATE TRIGGER trigger_update_connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connections_updated_at();

-- ============================================
-- POLÍTICAS RLS
-- ============================================

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
DROP POLICY IF EXISTS "Users can create connections" ON public.connections;
DROP POLICY IF EXISTS "Users can update received connections" ON public.connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON public.connections;

-- Los usuarios pueden ver sus propias conexiones
CREATE POLICY "Users can view their own connections"
    ON public.connections
    FOR SELECT
    USING (
        auth.uid() = user1_id OR 
        auth.uid() = user2_id
    );

-- Los usuarios pueden crear conexiones
CREATE POLICY "Users can create connections"
    ON public.connections
    FOR INSERT
    WITH CHECK (
        auth.uid() = user1_id AND
        auth.uid() = initiated_by
    );

-- Los usuarios pueden actualizar conexiones donde son el receptor
CREATE POLICY "Users can update received connections"
    ON public.connections
    FOR UPDATE
    USING (auth.uid() = user2_id)
    WITH CHECK (auth.uid() = user2_id);

-- Los usuarios pueden eliminar sus propias conexiones
CREATE POLICY "Users can delete their own connections"
    ON public.connections
    FOR DELETE
    USING (
        auth.uid() = user1_id OR 
        auth.uid() = user2_id
    );

-- ============================================
-- FUNCIÓN PARA OBTENER SOLICITUDES PENDIENTES
-- ============================================

CREATE OR REPLACE FUNCTION get_pending_connection_requests(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    sender_name TEXT,
    sender_avatar_url TEXT,
    sender_gender TEXT,
    initial_message TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user1_id as sender_id,
        u.name as sender_name,
        u.avatar_url as sender_avatar_url,
        u.gender as sender_gender,
        c.initial_message,
        c.created_at
    FROM public.connections c
    INNER JOIN public.users u ON c.user1_id = u.id
    WHERE c.user2_id = p_user_id
    AND c.status = 'pending'
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN PARA ACEPTAR SOLICITUD
-- ============================================

CREATE OR REPLACE FUNCTION accept_connection_request(p_connection_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE public.connections
    SET status = 'active', updated_at = NOW()
    WHERE id = p_connection_id
    AND user2_id = p_user_id
    AND status = 'pending';
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN PARA RECHAZAR SOLICITUD
-- ============================================

CREATE OR REPLACE FUNCTION reject_connection_request(p_connection_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE public.connections
    SET status = 'rejected', updated_at = NOW()
    WHERE id = p_connection_id
    AND user2_id = p_user_id
    AND status = 'pending';
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.connections IS 'Tabla para gestionar conexiones/solicitudes de amistad entre usuarios';
COMMENT ON COLUMN public.connections.user1_id IS 'Usuario que envía la solicitud';
COMMENT ON COLUMN public.connections.user2_id IS 'Usuario que recibe la solicitud';
COMMENT ON COLUMN public.connections.initiated_by IS 'Usuario que inició la conexión';
COMMENT ON COLUMN public.connections.status IS 'Estado de la conexión: pending, active, rejected';
