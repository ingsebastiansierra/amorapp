# Sistema de Notas de Voz Efímeras - Configuración

## Estado Actual
✅ Base de datos configurada (migración 011)
✅ Código de la app implementado
⚠️ Falta: Políticas de Storage para eliminación automática

## Problema
Las notas de voz no se eliminan del Storage después de escucharlas.

## Solución: Aplicar Políticas de Storage

### Paso 1: Verificar el bucket
1. Ve a Supabase Dashboard → Storage
2. Verifica que existe el bucket `voice-notes` (privado)
3. Si no existe, créalo:
   - Nombre: `voice-notes`
   - Public: NO (privado)
   - File size limit: 30 MB

### Paso 2: Aplicar políticas de eliminación

Ve a Supabase Dashboard → SQL Editor y ejecuta:

```sql
-- 1. Política: Los usuarios pueden subir a su propia carpeta
DROP POLICY IF EXISTS "Users can upload voice notes" ON storage.objects;
CREATE POLICY "Users can upload voice notes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Política: Los usuarios pueden ver sus propias notas
DROP POLICY IF EXISTS "Users can view their own voice notes" ON storage.objects;
CREATE POLICY "Users can view their own voice notes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Política: Los destinatarios pueden ver notas enviadas a ellos
DROP POLICY IF EXISTS "Recipients can view voice notes sent to them" ON storage.objects;
CREATE POLICY "Recipients can view voice notes sent to them"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND EXISTS (
        SELECT 1 FROM public.voice_notes
        WHERE storage_path = name
        AND to_user_id = auth.uid()
        AND is_expired = false
    )
);

-- 4. Política: Los usuarios pueden eliminar sus propias notas
DROP POLICY IF EXISTS "Users can delete their voice notes" ON storage.objects;
CREATE POLICY "Users can delete their voice notes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política: Los destinatarios pueden eliminar notas escuchadas
DROP POLICY IF EXISTS "Recipients can delete listened voice notes" ON storage.objects;
CREATE POLICY "Recipients can delete listened voice notes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'voice-notes'
    AND EXISTS (
        SELECT 1 FROM public.voice_notes
        WHERE storage_path = name
        AND to_user_id = auth.uid()
        AND listened = true
    )
);
```

### Paso 3: Verificar políticas

Ejecuta esto para verificar que se crearon correctamente:

```sql
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%voice%'
ORDER BY policyname;
```

Deberías ver 5 políticas:
1. `Recipients can delete listened voice notes` (DELETE)
2. `Recipients can view voice notes sent to them` (SELECT)
3. `Users can delete their voice notes` (DELETE)
4. `Users can upload voice notes` (INSERT)
5. `Users can view their own voice notes` (SELECT)

## Cómo Funciona

1. **Usuario A graba y envía** → Se guarda en `voice-notes/{user_a_id}/archivo.m4a`
2. **Usuario B recibe** → Puede ver y reproducir (política SELECT)
3. **Usuario B escucha** → Se marca `listened = true` en BD
4. **Usuario B termina de escuchar** → La app elimina automáticamente:
   - Archivo del storage (política DELETE permite porque `listened = true`)
   - Registro de la base de datos

## Logs para Debugging

La app ahora muestra logs detallados:
- 🗑️ Intentando eliminar nota de voz
- ✅ Archivo eliminado de storage
- ✅ Registro eliminado de BD
- ❌ Error eliminando de storage (si falla)

## Características Implementadas

✅ Grabación con límite de 30 segundos
✅ Forma de onda animada en tiempo real
✅ Deslizar para cancelar (como WhatsApp)
✅ Botón de enviar funcional
✅ Bloqueo de capturas de pantalla al reproducir
✅ Auto-eliminación después de escuchar
✅ Notificaciones en tiempo real
✅ Contador de notas pendientes
✅ Diseño compacto estilo WhatsApp

## Próximos Pasos

1. Aplicar las políticas de storage (arriba)
2. Probar enviando una nota de voz
3. Escucharla completamente
4. Verificar en Supabase Storage que se eliminó
5. Revisar logs en la consola de la app
