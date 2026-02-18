# 📝 Registro Mejorado - Instrucciones de Instalación

## Cambios Realizados

Se ha mejorado el formulario de registro para incluir:

1. ✅ **Fecha de Nacimiento** (obligatorio)
   - Validación de edad mínima (18 años)
   - Selector de fecha nativo para iOS y Android

2. ✅ **Foto de Perfil** (opcional)
   - Permite seleccionar una imagen de la galería
   - Se sube automáticamente a Supabase Storage
   - Vista previa circular de la imagen

## Instalación Requerida

### 1. Instalar DateTimePicker

```bash
npx expo install @react-native-community/datetimepicker
```

### 2. Verificar Permisos

Los permisos de galería ya están configurados en `app.json`, pero verifica que estén presentes:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Palpitos necesita acceso a tus fotos para que puedas enviar imágenes privadas a tu pareja."
        }
      ]
    ]
  }
}
```

### 3. Verificar Bucket de Avatars en Supabase

Asegúrate de que el bucket `avatars` existe en Supabase Storage. Si no existe, créalo:

1. Ve a Supabase Dashboard → Storage
2. Crea un nuevo bucket llamado `avatars`
3. Configura como **público** o **privado** según tu preferencia
4. Las políticas RLS ya deberían estar configuradas por la migración `012_avatar_storage.sql`

## Archivos Modificados

### 1. `app/(auth)/register.tsx`
- ✅ Agregado selector de fecha de nacimiento
- ✅ Agregado selector de foto de perfil
- ✅ Validación de edad mínima (18 años)
- ✅ Vista previa de la imagen seleccionada
- ✅ Nuevos estilos para los campos adicionales

### 2. `src/core/store/useAuthStore.ts`
- ✅ Actualizada función `signUp` para aceptar `birthDate` y `avatarUri`
- ✅ Lógica para subir avatar a Supabase Storage
- ✅ Guardar `birth_date` y `avatar_url` en la tabla `users`

## Cómo Funciona

### Flujo de Registro

1. Usuario completa el formulario:
   - Nombre
   - Email
   - Contraseña
   - **Fecha de Nacimiento** (obligatorio)
   - **Foto de Perfil** (opcional)
   - Género

2. Al presionar "Crear Cuenta":
   - Se valida que todos los campos obligatorios estén completos
   - Se valida que la edad sea mayor a 18 años
   - Se crea la cuenta en Supabase Auth
   - Si hay foto, se sube a Storage bucket `avatars`
   - Se crea el perfil en la tabla `users` con todos los datos

3. Usuario recibe email de confirmación

### Validaciones Implementadas

```typescript
// Edad mínima
const calculateAge = (date: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
    }
    
    return age;
};

// Validar antes de registrar
if (age < 18) {
    Alert.alert('Error', 'Debes tener al menos 18 años para registrarte');
    return;
}
```

## Próximos Pasos Opcionales

### 1. Agregar Más Campos (Opcional)
Podrías agregar:
- País/Ciudad
- Biografía corta
- Intereses
- Estado de relación

### 2. Mejorar Validación de Fecha
- Agregar validación de fecha futura
- Mostrar edad calculada en tiempo real
- Agregar selector de año más rápido

### 3. Mejorar Selector de Avatar
- Permitir tomar foto con la cámara
- Agregar recorte de imagen más avanzado
- Comprimir imagen antes de subir
- Mostrar progreso de subida

## Ejemplo de Uso

```typescript
// En register.tsx
const handleRegister = async () => {
    // ... validaciones ...
    
    await signUp(
        email, 
        password, 
        name, 
        gender, 
        birthDate,      // Date | null
        avatarUri       // string | null
    );
};
```

## Troubleshooting

### Error: "DateTimePicker not found"
```bash
npx expo install @react-native-community/datetimepicker
```

### Error: "Storage bucket not found"
1. Ve a Supabase Dashboard
2. Storage → Create bucket → `avatars`
3. Ejecuta la migración `012_avatar_storage.sql`

### Error: "Permission denied uploading avatar"
Verifica las políticas RLS en Supabase:
```sql
-- Permitir a usuarios subir su propio avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Notas Importantes

- ⚠️ La fecha de nacimiento es **obligatoria** y debe ser mayor a 18 años
- ✅ La foto de perfil es **opcional**
- 🔒 Los avatares se guardan en Storage con el formato: `{user_id}-{timestamp}.{ext}`
- 📱 El selector de fecha es nativo para mejor UX en iOS y Android

---

**¡Listo!** El registro ahora captura información más completa del usuario desde el inicio.
