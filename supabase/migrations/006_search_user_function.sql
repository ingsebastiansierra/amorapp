-- Función para buscar usuarios por código (primeros 8 caracteres del UUID)
CREATE OR REPLACE FUNCTION search_user_by_code(code_prefix TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    couple_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.couple_id
    FROM public.users u
    WHERE LOWER(u.id::TEXT) LIKE LOWER(code_prefix) || '%'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION search_user_by_code(TEXT) TO authenticated;
