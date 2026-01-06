-- Agregar campo de fecha de nacimiento
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Crear función para calcular edad
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN DATE_PART('year', AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- SELECT name, birth_date, calculate_age(birth_date) as age FROM public.users;
