-- ⚠️ SCRIPT PARA BORRAR USUARIOS ESPECÍFICOS
-- IDs a borrar:
-- e7936720-8fa9-45d5-ba76-b84d32c3f020
-- c60a2dba-06b8-4ad9-8457-559b84e39a32

-- ============================================
-- PASO 1: CONSULTAR DATOS ANTES DE BORRAR
-- ============================================

-- Ver información de los usuarios
SELECT 
    id,
    email,
    name,
    couple_id,
    created_at
FROM public.users
WHERE id IN (
    'e7936720-8fa9-45d5-ba76-b84d32c3f020',
    'c60a2dba-06b8-4ad9-8457-559b84e39a32'
);

-- Ver si tienen pareja
SELECT * FROM public.couples
WHERE user1_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32')
   OR user2_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32');

-- ============================================
-- PASO 2: BORRAR DATOS RELACIONADOS
-- ============================================

BEGIN;

-- 1. Borrar estados emocionales
DELETE FROM public.emotional_states
WHERE user_id IN (
    'e7936720-8fa9-45d5-ba76-b84d32c3f020',
    'c60a2dba-06b8-4ad9-8457-559b84e39a32'
);

-- 2. Borrar gestos (enviados y recibidos)
DELETE FROM public.gestures
WHERE from_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32')
   OR to_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32');

-- 3. Borrar interacciones de corazón (enviadas y recibidas)
DELETE FROM public.heart_interactions
WHERE from_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32')
   OR to_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32');

-- 4. Borrar imágenes privadas (enviadas y recibidas)
DELETE FROM public.images_private
WHERE from_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32')
   OR to_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32');

-- 5. Borrar mensajes de sincronización (si existe la tabla)
DELETE FROM public.sync_messages
WHERE from_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32')
   OR to_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32');

-- 6. Borrar notas de voz (si existe la tabla)
DELETE FROM public.voice_notes
WHERE from_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32')
   OR to_user_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32');

-- 7. Borrar sincronizaciones de relación (si existe la tabla)
DELETE FROM public.relationship_syncs
WHERE user1_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32')
   OR user2_id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32');

-- 8. Obtener couple_ids antes de borrar usuarios
DO $$
DECLARE
    couple_ids UUID[];
BEGIN
    -- Guardar couple_ids en una variable temporal
    SELECT ARRAY_AGG(DISTINCT couple_id) INTO couple_ids
    FROM public.users
    WHERE id IN ('e7936720-8fa9-45d5-ba76-b84d32c3f020', 'c60a2dba-06b8-4ad9-8457-559b84e39a32')
      AND couple_id IS NOT NULL;

    -- Borrar métricas de conexión de esas parejas
    IF couple_ids IS NOT NULL THEN
        DELETE FROM public.connection_metrics
        WHERE couple_id = ANY(couple_ids);

        -- Borrar progreso de retos de esas parejas
        DELETE FROM public.challenge_progress
        WHERE couple_id = ANY(couple_ids);

        -- Borrar las parejas
        DELETE FROM public.couples
        WHERE id = ANY(couple_ids);
    END IF;
END $$;

-- 9. Borrar usuarios de la tabla public.users
DELETE FROM public.users
WHERE id IN (
    'e7936720-8fa9-45d5-ba76-b84d32c3f020',
    'c60a2dba-06b8-4ad9-8457-559b84e39a32'
);

-- 10. Borrar usuarios de auth.users (Supabase Auth)
DELETE FROM auth.users
WHERE id IN (
    'e7936720-8fa9-45d5-ba76-b84d32c3f020',
    'c60a2dba-06b8-4ad9-8457-559b84e39a32'
);

COMMIT;

-- ============================================
-- PASO 3: VERIFICAR QUE SE BORRARON
-- ============================================

-- Verificar que ya no existen en public.users
SELECT COUNT(*) as usuarios_restantes
FROM public.users
WHERE id IN (
    'e7936720-8fa9-45d5-ba76-b84d32c3f020',
    'c60a2dba-06b8-4ad9-8457-559b84e39a32'
);
-- Debería retornar 0

-- Verificar que ya no existen en auth.users
SELECT COUNT(*) as usuarios_auth_restantes
FROM auth.users
WHERE id IN (
    'e7936720-8fa9-45d5-ba76-b84d32c3f020',
    'c60a2dba-06b8-4ad9-8457-559b84e39a32'
);
-- Debería retornar 0

-- ============================================
-- PASO 4: LIMPIAR STORAGE (OPCIONAL)
-- ============================================

-- Si tenían avatares, borrarlos manualmente desde Supabase Dashboard:
-- 1. Ve a Storage → avatars
-- 2. Busca archivos que empiecen con:
--    - e7936720-8fa9-45d5-ba76-b84d32c3f020
--    - c60a2dba-06b8-4ad9-8457-559b84e39a32
-- 3. Bórralos manualmente

-- Si tenían imágenes privadas, borrarlas desde:
-- Storage → private-images

-- Si tenían notas de voz, borrarlas desde:
-- Storage → voice-notes

-- ============================================
-- RESUMEN
-- ============================================

SELECT 
    'Usuarios borrados exitosamente' as status,
    NOW() as timestamp;
