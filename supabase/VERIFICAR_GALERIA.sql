-- Script para verificar que la galería personal esté correctamente configurada
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar que la tabla existe
SELECT 
    'Tabla personal_gallery' as componente,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_gallery')
        THEN '✅ Existe'
        ELSE '❌ No existe'
    END as estado;

-- 2. Verificar columnas de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'personal_gallery'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
SELECT 
    policyname as nombre_politica,
    cmd as comando,
    qual as condicion
FROM pg_policies
WHERE tablename = 'personal_gallery';

-- 4. Verificar que RLS está habilitado
SELECT 
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'personal_gallery';

-- 5. Verificar índices
SELECT 
    indexname as nombre_indice,
    indexdef as definicion
FROM pg_indexes
WHERE tablename = 'personal_gallery';

-- 6. Verificar bucket de storage
SELECT 
    id,
    name,
    public as es_publico,
    created_at
FROM storage.buckets
WHERE id = 'personal-gallery';

-- 7. Contar fotos existentes (si hay)
SELECT 
    COUNT(*) as total_fotos,
    COUNT(CASE WHEN visibility = 'visible' THEN 1 END) as fotos_visibles,
    COUNT(CASE WHEN visibility = 'private' THEN 1 END) as fotos_privadas
FROM personal_gallery;
