# Checklist: Galería Personal

## ✅ Verificación de Código

### Archivos creados
- [x] `src/core/types/gallery.ts` - Tipos TypeScript
- [x] `src/core/services/galleryService.ts` - Servicio de galería
- [x] `src/features/gallery/PersonalGalleryScreen.tsx` - Pantalla principal
- [x] `app/(app)/private-images.tsx` - Ruta actualizada

### Archivos SQL
- [x] `supabase/migrations/016_personal_gallery.sql` - Migración
- [x] `supabase/APLICAR_GALERIA_PERSONAL.sql` - Script de aplicación
- [x] `supabase/CREAR_BUCKET_GALERIA.sql` - Script para bucket
- [x] `supabase/VERIFICAR_GALERIA.sql` - Script de verificación

### Diagnósticos TypeScript
- [x] Sin errores en PersonalGalleryScreen.tsx
- [x] Sin errores en galleryService.ts
- [x] Sin errores en gallery.ts
- [x] Sin errores en private-images.tsx

## ✅ Verificación de Base de Datos

### Ejecutar en Supabase SQL Editor:
```sql
-- Copiar y pegar: supabase/VERIFICAR_GALERIA.sql
```

Deberías ver:
- ✅ Tabla `personal_gallery` existe
- ✅ 5 políticas RLS activas
- ✅ RLS habilitado
- ✅ 2 índices creados
- ✅ Bucket `personal-gallery` existe y es público

## ✅ Verificación de Storage

### En Supabase Dashboard > Storage:
1. Bucket `personal-gallery` debe existir
2. Debe estar marcado como "Public"
3. Las políticas deben permitir:
   - ✅ Usuarios pueden subir a su carpeta
   - ✅ Usuarios pueden ver sus archivos
   - ✅ Usuarios pueden eliminar sus archivos
   - ✅ Acceso público para lectura

## ✅ Funcionalidades Implementadas

### Pantalla Principal
- [x] Dos pestañas: "Mis Fotos" y "Fotos de [Pareja]"
- [x] Botón "Subir Nueva Foto" (solo en "Mis Fotos")
- [x] Grid de 2 columnas
- [x] Contador de fotos

### Gestión de Fotos
- [x] Subir foto desde galería
- [x] Modal de configuración con:
  - [x] Vista previa de imagen
  - [x] Campo de descripción (opcional)
  - [x] Selector de visibilidad (Visible / Solo yo)
- [x] Cambiar visibilidad tocando el badge
- [x] Eliminar fotos propias
- [x] Ver fotos de la pareja (solo las visibles)

### Indicadores Visuales
- [x] Badge de corazón rosa = VISIBLE
- [x] Badge de candado gris = SOLO YO
- [x] Label en cada foto mostrando estado
- [x] Banner informativo sobre fotos privadas

### Seguridad
- [x] RLS: Solo el dueño ve sus fotos privadas
- [x] RLS: La pareja solo ve fotos marcadas como "visible"
- [x] Validación de pareja conectada
- [x] Políticas de storage correctas

## 🧪 Pruebas Sugeridas

### Prueba 1: Subir foto
1. Ir a pestaña "Galería"
2. Presionar "Subir Nueva Foto"
3. Seleccionar imagen
4. Elegir visibilidad "Visible"
5. Subir
6. ✅ Debe aparecer en "Mis Fotos" con corazón rosa

### Prueba 2: Cambiar visibilidad
1. Tocar el corazón rosa de una foto
2. ✅ Debe cambiar a candado gris
3. ✅ Label debe cambiar a "SOLO YO"
4. Tocar nuevamente
5. ✅ Debe volver a corazón rosa

### Prueba 3: Ver fotos de pareja
1. Ir a pestaña "Fotos de [Nombre]"
2. ✅ Solo deben aparecer fotos marcadas como "VISIBLE"
3. ✅ No deben aparecer fotos "SOLO YO"

### Prueba 4: Eliminar foto
1. Presionar icono de basura en una foto
2. Confirmar eliminación
3. ✅ Foto debe desaparecer
4. ✅ Archivo debe eliminarse del storage

## 🐛 Problemas Conocidos

### Resueltos
- ✅ Error de import `expo-image-manipulator` - Removido, usando compresión nativa
- ✅ Imports con alias `@core` - Corregidos a `@/core`
- ✅ Error JSX en login.tsx - Resuelto

### Pendientes
- ⚠️ No hay compresión de imágenes (se suben en calidad 0.8)
- ⚠️ Thumbnails usan la misma imagen (no hay versión pequeña)

## 📝 Notas

- Las imágenes se guardan en: `personal-gallery/{user_id}/{timestamp}.jpg`
- Calidad de compresión: 0.8 (80%)
- Aspecto de recorte: 4:3
- Máximo tamaño de archivo: 10MB (no validado actualmente)
- Máximo caracteres en descripción: 500

## 🎨 Colores Usados

- Rosa principal: `#FF6B9D`
- Rosa claro: `#FFE4EC`
- Gris oscuro: `#666`
- Gris claro: `#F0F0F0`
- Blanco: `#FFF`

## 📚 Documentación

Ver `INSTRUCCIONES_GALERIA_PERSONAL.md` para más detalles.
