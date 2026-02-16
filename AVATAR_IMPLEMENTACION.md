# Implementación de Avatar de Perfil

## ✅ Archivos Creados

### 1. Migración de Base de Datos
- `supabase/migrations/012_avatar_storage.sql` - Crea el bucket y políticas de storage
- `supabase/APLICAR_POLITICAS_AVATARS.sql` - Script para aplicar las políticas manualmente

### 2. Servicios
- `src/core/services/avatarService.ts` - Servicio para manejar la subida y gestión de avatares

### 3. Componentes
- `src/shared/components/AvatarPicker.tsx` - Componente para seleccionar y subir avatar

### 4. Pantallas Actualizadas
- `app/(app)/profile.tsx` - Pantalla de perfil con soporte para avatar

## 🚀 Pasos para Implementar

### 1. Aplicar Políticas de Storage en Supabase

Ve al **SQL Editor** en tu dashboard de Supabase y ejecuta el contenido de:
```
supabase/APLICAR_POLITICAS_AVATARS.sql
```

Esto creará:
- ✅ Bucket público `avatars`
- ✅ Políticas para que usuarios suban/actualicen/eliminen su propio avatar
- ✅ Política para que todos puedan ver los avatares

### 2. Verificar Permisos

Asegúrate de que el campo `avatar_url` existe en la tabla `users`:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar_url';
```

### 3. Probar la Funcionalidad

1. Abre la app y ve a tu perfil
2. Toca la foto de perfil (verás el ícono de cámara 📷)
3. Selecciona una imagen de tu galería
4. La imagen se subirá automáticamente
5. Verás un indicador de carga mientras se sube
6. Una vez completado, verás tu nueva foto de perfil

## 🎨 Características

- **Selección de imagen** con recorte cuadrado (1:1)
- **Compresión automática** a 80% de calidad
- **Indicador de carga** mientras se sube
- **Badge de edición** (📷) para indicar que es clickeable
- **Fallback a emoji** si no hay avatar
- **URLs públicas** para compartir avatares
- **Políticas de seguridad** - cada usuario solo puede modificar su propio avatar

## 📁 Estructura de Storage

Los avatares se guardan en:
```
avatars/
  └── {user_id}/
      └── avatar-{timestamp}.jpg
```

Ejemplo:
```
avatars/123e4567-e89b-12d3-a456-426614174000/avatar-1708123456789.jpg
```

## 🔒 Seguridad

- Solo usuarios autenticados pueden subir avatares
- Cada usuario solo puede modificar archivos en su propia carpeta
- Los avatares son públicos (cualquiera puede verlos con la URL)
- Las URLs son permanentes y no expiran

## 🛠️ Funciones del Servicio

### `avatarService.pickImage()`
Abre el selector de imágenes con:
- Recorte cuadrado (1:1)
- Compresión a 80%
- Solo imágenes

### `avatarService.uploadAvatar(userId, imageUri)`
Sube la imagen a Supabase Storage y retorna:
```typescript
{
  url: string,    // URL pública
  path: string    // Ruta en storage
}
```

### `avatarService.updateUserAvatar(userId, avatarUrl)`
Actualiza el campo `avatar_url` en la tabla `users`

### `avatarService.getAvatarUrl(avatarUrl)`
Convierte una ruta de storage a URL pública

## 🎯 Próximas Mejoras (Opcional)

- [ ] Permitir tomar foto con la cámara
- [ ] Agregar filtros o efectos
- [ ] Permitir eliminar avatar y volver al emoji
- [ ] Mostrar avatar en más lugares (home, mensajes, etc.)
- [ ] Caché de avatares para mejor rendimiento
- [ ] Redimensionar imágenes en el servidor para optimizar tamaño

## 🐛 Troubleshooting

### Error: "Se necesitan permisos para acceder a la galería"
- Asegúrate de que la app tenga permisos de galería en la configuración del dispositivo

### Error al subir imagen
- Verifica que las políticas de storage estén aplicadas correctamente
- Revisa que el bucket `avatars` exista y sea público
- Verifica la conexión a internet

### La imagen no se muestra
- Verifica que la URL sea pública
- Revisa que el campo `avatar_url` se haya actualizado en la base de datos
- Intenta recargar el perfil
