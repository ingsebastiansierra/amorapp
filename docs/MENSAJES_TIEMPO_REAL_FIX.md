# Corrección: Mensajes en Tiempo Real

## Problemas Solucionados

### 1. ❌ Mensajes con Retraso o que No Llegan
**Problema:** Los mensajes usaban polling cada 5 segundos en lugar de tiempo real.

**Solución:** 
- Implementada suscripción en tiempo real con Supabase Realtime
- Los mensajes ahora llegan instantáneamente
- Polling de respaldo cada 30 segundos (solo por seguridad)

### 2. ❌ Conflicto en Validación de Longitud
**Problema:** La tabla permitía 50 caracteres pero la validación decía 500. Además, el frontend limitaba a 200 caracteres.

**Solución:**
- Actualizada la tabla `sync_messages` para permitir hasta 500 caracteres
- Actualizado `maxLength` en `messages.tsx` de 200 a 500
- Actualizado `maxLength` en `home.tsx` de 50 a 500
- Agregado contador de caracteres visual (X/500)
- Consistencia total entre frontend y backend

### 3. ❌ Rate Limiting Sin Feedback
**Problema:** Cuando se alcanzaba el límite de mensajes, fallaba silenciosamente.

**Solución:**
- Agregado manejo de errores específico para rate limiting
- Mensajes de error claros al usuario:
  - "Estás enviando mensajes muy rápido. Espera unos segundos."
  - "El mensaje no puede tener más de 500 caracteres."
  - "No se pudo enviar el mensaje. Verifica tu conexión."
- Límite aumentado de 10 a 20 mensajes por minuto

### 4. ❌ Notificaciones Sin Manejo de Errores
**Problema:** Las notificaciones fallaban sin avisar.

**Solución:**
- Validación de token antes de enviar
- Manejo de errores HTTP
- Prioridad "high" para notificaciones de mensajes
- Los mensajes se guardan aunque falle la notificación

## Cambios Técnicos

### Frontend

#### app/(app)/messages.tsx
```typescript
// Antes: Polling cada 5 segundos
const interval = setInterval(loadMessages, 5000);

// Ahora: Suscripción en tiempo real + polling de respaldo
const channel = supabase
    .channel('sync-messages-realtime')
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sync_messages',
        filter: `to_user_id=eq.${user.id}`,
    }, (payload) => {
        loadMessages(); // Recarga instantánea
    })
    .subscribe();

// Límite aumentado
maxLength={500}  // Antes: 200

// Contador de caracteres
{newMessage.length > 0 && (
    <Text style={styles.charCounter}>
        {newMessage.length}/500
    </Text>
)}
```

#### app/(app)/home.tsx
```typescript
// Límite aumentado en sincronización
maxLength={500}  // Antes: 50
Mensaje ({syncMessage.length}/500)  // Antes: /50
```

### Backend (supabase/migrations/015_optimize_realtime_messages.sql)

1. **Constraint actualizado:**
   ```sql
   ALTER TABLE public.sync_messages DROP CONSTRAINT IF EXISTS sync_messages_message_check;
   ALTER TABLE public.sync_messages ADD CONSTRAINT sync_messages_message_check 
   CHECK (char_length(message) <= 500 AND char_length(message) >= 1);
   ```

2. **Índices optimizados:**
   - `idx_sync_messages_couple_created`: Para consultas por pareja
   - `idx_sync_messages_unread`: Para mensajes no leídos
   - `idx_sync_messages_reply`: Para mensajes con respuestas

3. **Trigger de notificación:**
   - Notifica cambios en tiempo real vía `pg_notify`
   - Solo notifica al destinatario del mensaje

4. **Rate limiting mejorado:**
   - Límite aumentado a 20 mensajes/minuto
   - Mensajes de error más descriptivos

### Servicio de Notificaciones (notificationService.ts)

```typescript
// Validación de token
if (!notification.to || notification.to.trim() === '') {
    console.error('❌ Token de notificación vacío o inválido');
    return;
}

// Prioridad alta para mensajes
priority: notification.priority || 'high'

// Re-lanzar errores para manejo en el llamador
throw error;
```

## Beneficios

✅ **Mensajes instantáneos:** Llegan en menos de 1 segundo
✅ **Mensajes más largos:** Hasta 500 caracteres (antes 50-200)
✅ **Mejor UX:** Mensajes de error claros y contador de caracteres
✅ **Más confiable:** Polling de respaldo si falla el tiempo real
✅ **Mejor rendimiento:** Índices optimizados para consultas rápidas
✅ **Más flexible:** Límite de 20 mensajes/minuto (antes 10)

## Scripts de Corrección

### fix_message_constraint.sql
Elimina el constraint antiguo y agrega el nuevo de 500 caracteres.

### fix_duplicate_constraint.sql
Elimina todos los constraints duplicados y deja solo uno correcto.

## Migración

Para aplicar los cambios en la base de datos:

```bash
# Aplicar la migración
supabase db push

# O ejecutar manualmente en SQL Editor
-- Ejecutar: supabase/fix_duplicate_constraint.sql
```

## Pruebas Recomendadas

1. ✅ **Envío rápido:** Enviar varios mensajes seguidos
2. ✅ **Tiempo real:** Abrir la app en dos dispositivos y enviar mensajes
3. ✅ **Rate limiting:** Intentar enviar más de 20 mensajes en 1 minuto
4. ✅ **Mensajes largos:** Enviar mensajes de 400+ caracteres
5. ✅ **Contador:** Verificar que el contador X/500 aparece al escribir
6. ✅ **Sin conexión:** Enviar mensajes sin internet y verificar el error

## Notas

- Los mensajes antiguos se limpian automáticamente después de 7 días
- Las notificaciones push pueden fallar si el token es inválido (el mensaje se guarda igual)
- El polling de respaldo asegura que los mensajes lleguen aunque falle el tiempo real
- El contador de caracteres solo aparece cuando hay texto escrito
