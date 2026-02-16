# Implementación de Editar Perfil

## ✅ Archivos Creados/Modificados

### 1. Migración de Base de Datos
- `supabase/migrations/013_add_name_change_tracking.sql` - Agrega campo para rastrear cambios de nombre
- `supabase/APLICAR_NAME_CHANGE_TRACKING.sql` - Script para aplicar manualmente

### 2. Pantallas
- `app/(app)/edit-profile.tsx` - Nueva pantalla para editar perfil
- `app/(app)/profile.tsx` - Actualizada para mostrar email correcto y botón funcional
- `app/(app)/_layout.tsx` - Actualizado con la nueva ruta

### 3. Tipos
- `src/core/types/database.ts` - Actualizado con el campo `last_name_change`

## 🚀 Pasos para Implementar

### 1. Aplicar Migración en Supabase

Ve al **SQL Editor** en tu dashboard de Supabase y ejecuta:
```sql
-- Copia y pega el contenido de:
supabase/APLICAR_NAME_CHANGE_TRACKING.sql
```

Esto agregará el campo `last_name_change` a la tabla `users`.

### 2. Probar la Funcionalidad

1. Abre la app y ve a tu perfil
2. Toca "Editar Perfil"
3. Cambia tu nombre
4. Guarda los cambios
5. Intenta cambiar el nombre de nuevo → verás que está bloqueado por 60 días

## 🎨 Características

### Restricción de Cambio de Nombre
- Solo se puede cambiar el nombre **una vez cada 60 días**
- El campo se bloquea automáticamente después de un cambio
- Muestra cuántos días faltan para poder cambiar de nuevo
- Muestra la fecha del último cambio

### Validaciones
- El nombre no puede estar vacío
- Debe tener al menos 2 caracteres
- Máximo 50 caracteres
- Se guarda con trim (sin espacios al inicio/final)

### Interfaz
- **Indicador visual** cuando el campo está bloqueado (🔒)
- **Contador de días** hasta el próximo cambio permitido
- **Fecha del último cambio** para referencia
- **Información** sobre la restricción de 60 días
- **Botón deshabilitado** cuando no se puede cambiar

## 📊 Lógica de Restricción

```typescript
// Calcular días desde el último cambio
const daysSinceChange = Math.floor(
    (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
);

// Verificar si puede cambiar (60 días = ~2 meses)
const canChange = daysSinceChange >= 60;
```

## 🔒 Seguridad

- El campo `last_name_change` se actualiza automáticamente al guardar
- La validación se hace tanto en el cliente como en la base de datos
- No se puede manipular desde el frontend

## 📝 Datos Mostrados en Perfil

La pantalla de perfil ahora muestra:
- ✅ **Email real** del usuario (no de ejemplo)
- ✅ **Nombre** actualizable con restricción
- ✅ **Género** del usuario
- ✅ **Fecha de nacimiento** formateada
- ✅ **Edad** calculada automáticamente
- ✅ **Avatar** editable (implementado anteriormente)

## 🎯 Flujo de Usuario

1. **Primera vez**: Usuario puede cambiar su nombre libremente
2. **Después del cambio**: Campo se bloquea por 60 días
3. **Durante el bloqueo**: 
   - Campo aparece deshabilitado
   - Muestra mensaje con días restantes
   - Botón de guardar deshabilitado
4. **Después de 60 días**: Campo se desbloquea automáticamente

## 🐛 Troubleshooting

### El campo no se bloquea
- Verifica que la migración se aplicó correctamente
- Revisa que el campo `last_name_change` existe en la tabla `users`

### No muestra los días correctos
- Verifica que las fechas se están guardando correctamente en UTC
- Revisa la consola para ver los valores de `daysSinceChange`

### Error al guardar
- Verifica que el usuario tiene permisos de actualización en la tabla `users`
- Revisa las políticas RLS de Supabase

## 💡 Mejoras Futuras (Opcional)

- [ ] Permitir cambiar otros campos (bio, ubicación, etc.)
- [ ] Historial de cambios de nombre
- [ ] Notificación cuando se desbloquee el cambio de nombre
- [ ] Verificación de nombres duplicados
- [ ] Restricciones de caracteres especiales en nombres
