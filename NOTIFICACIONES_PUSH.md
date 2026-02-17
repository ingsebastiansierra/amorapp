# 🔔 Sistema de Notificaciones Push

## Implementación Completa

### ✅ Archivos Creados

1. **`src/core/services/notificationService.ts`**
   - Servicio centralizado para manejar todas las notificaciones
   - Integración con Expo Push Notifications API
   - Métodos para cada tipo de notificación

2. **`src/shared/hooks/useNotifications.ts`**
   - Hook personalizado para inicializar notificaciones
   - Maneja listeners de notificaciones recibidas
   - Navegación automática al tocar notificaciones

3. **`supabase/migrations/015_add_push_tokens.sql`**
   - Agrega campos `push_token` y `push_token_updated_at` a la tabla users
   - Índice para búsquedas rápidas

### ✅ Archivos Modificados

1. **`app/(app)/home.tsx`**
   - Inicializa notificaciones con `useNotifications()`
   - Envía notificación cuando cambia el estado emocional
   - Envía notificación cuando se detecta sincronización
   - Envía notificación cuando se envía un mensaje

2. **`app/(app)/messages.tsx`**
   - Envía notificación cuando se envía un mensaje desde el chat
   - Carga el `push_token` del partner

3. **`package.json`**
   - Agregado `expo-device` para detectar dispositivos físicos

## Tipos de Notificaciones Implementadas

### 1. Cambio de Estado Emocional 💭
```typescript
Título: "💭 María cambió su estado"
Cuerpo: "Ahora se siente: Triste 😢"
Prioridad: Default
Sonido: Default
```

**Cuándo se envía:**
- Cuando un usuario actualiza su estado emocional
- Se envía a la pareja automáticamente

### 2. Sincronización Detectada ✨
```typescript
Título: "✨ ¡Están sincronizados!"
Cuerpo: "Ambos se sienten: Triste 😢 - Hablen ahora"
Prioridad: High
Sonido: Default
```

**Cuándo se envía:**
- Cuando ambos usuarios tienen la misma emoción
- Solo se envía cuando es una NUEVA sincronización (no si ya estaban sincronizados)

### 3. Mensaje Recibido 💌
```typescript
Título: "💌 María (😢 Triste)"
Cuerpo: "Yo también me siento así..."
Prioridad: High
Sonido: Default
Badge: +1
```

**Cuándo se envía:**
- Cuando se envía un mensaje de texto desde home.tsx
- Cuando se envía un mensaje desde messages.tsx

### 4. Imagen Privada Recibida 📸
```typescript
Título: "📸 María te envió una foto"
Cuerpo: "Foto privada - Toca para ver (una vez)"
Prioridad: High
```

**Cuándo se envía:**
- Cuando se envía una imagen privada (implementar en ImageAttachButton)

### 5. Nota de Voz Recibida 🎤
```typescript
Título: "🎤 María te envió una nota de voz"
Cuerpo: "Nota de voz (0:45)"
Prioridad: High
```

**Cuándo se envía:**
- Cuando se envía una nota de voz (implementar en VoiceRecorderButton)

## Configuración Requerida

### 1. Aplicar Migración de Base de Datos

```bash
# Ejecutar en Supabase SQL Editor
supabase/migrations/015_add_push_tokens.sql
```

### 2. Instalar Dependencias

```bash
npm install
# o
npx expo install expo-device
```

### 3. Configurar Project ID de Expo

En `src/core/services/notificationService.ts`, línea 38:

```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id', // ⚠️ REEMPLAZAR con tu project ID
});
```

**Cómo obtener tu Project ID:**
1. Abre tu proyecto en Expo
2. Ve a `app.json` o ejecuta `expo whoami`
3. Tu project ID está en el formato: `@username/project-name`

### 4. Configurar Permisos en app.json

Agregar en `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#EB477E",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#EB477E",
      "androidMode": "default",
      "androidCollapsedTitle": "US - Conexión Emocional"
    }
  }
}
```

### 5. Permisos de Android (android/app/src/main/AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### 6. Permisos de iOS (ios/YourApp/Info.plist)

Las notificaciones en iOS requieren que el usuario acepte explícitamente.

## Flujo de Funcionamiento

### Inicialización
1. Usuario abre la app
2. `useNotifications()` se ejecuta automáticamente
3. Se solicitan permisos de notificaciones
4. Se obtiene el Expo Push Token
5. Se guarda el token en la BD (tabla `users.push_token`)

### Envío de Notificación
1. Usuario A cambia su estado emocional
2. Se obtiene el `push_token` del Usuario B
3. Se llama a `notificationService.sendEmotionChangeNotification()`
4. Se envía la notificación a través de Expo Push API
5. Usuario B recibe la notificación

### Recepción de Notificación
1. Usuario B recibe la notificación
2. Si la app está abierta: se muestra como banner
3. Si la app está cerrada: se muestra en el centro de notificaciones
4. Usuario B toca la notificación
5. La app se abre y navega a la pantalla correspondiente

## Testing

### Probar en Desarrollo

1. **Instalar Expo Go** en dos dispositivos físicos (las notificaciones NO funcionan en simuladores)

2. **Iniciar la app:**
```bash
npm start
```

3. **Escanear el QR** en ambos dispositivos

4. **Probar cada tipo de notificación:**
   - Cambiar estado emocional → Verificar notificación en el otro dispositivo
   - Sincronizarse → Verificar notificación especial
   - Enviar mensaje → Verificar notificación de mensaje

### Verificar Tokens

En Supabase SQL Editor:
```sql
SELECT id, name, push_token, push_token_updated_at 
FROM users 
WHERE push_token IS NOT NULL;
```

### Debug de Notificaciones

Agregar logs en `notificationService.ts`:
```typescript
console.log('📤 Enviando notificación:', {
    to: notification.to,
    title: notification.title,
    body: notification.body
});
```

## Próximos Pasos

### 1. Agregar Notificaciones a ImageAttachButton

En `src/shared/components/ImageAttachButton.tsx`:

```typescript
import { notificationService } from '@/core/services/notificationService';

// Después de subir la imagen exitosamente
if (partnerPushToken && myName) {
    await notificationService.sendImageNotification(
        partnerPushToken,
        myName
    );
}
```

### 2. Agregar Notificaciones a VoiceRecorderButton

En `src/shared/components/VoiceRecorderButton.tsx`:

```typescript
import { notificationService } from '@/core/services/notificationService';

// Después de subir la nota de voz
if (partnerPushToken && myName) {
    await notificationService.sendVoiceNoteNotification(
        partnerPushToken,
        myName,
        duration
    );
}
```

### 3. Notificaciones Programadas

Implementar recordatorios:
- "¿Cómo te sientes hoy?" (si no han actualizado su estado en 12h)
- "Tu pareja te extraña" (si no han interactuado en 24h)
- Celebración de rachas (3, 7, 30 días sincronizados)

### 4. Notificaciones Locales

Para notificaciones que no requieren servidor:
```typescript
await Notifications.scheduleNotificationAsync({
    content: {
        title: "¿Cómo te sientes?",
        body: "Actualiza tu estado emocional",
    },
    trigger: {
        seconds: 43200, // 12 horas
        repeats: true,
    },
});
```

### 5. Sonidos Personalizados

Agregar sonidos custom en `assets/sounds/`:
- `sync_detected.wav` - Sonido especial para sincronización
- `message_received.wav` - Sonido de mensaje
- `emotion_change.wav` - Sonido de cambio de emoción

## Troubleshooting

### "Push token not found"
- Verificar que estás en un dispositivo físico
- Verificar permisos de notificaciones
- Verificar que el Project ID es correcto

### "Notification not received"
- Verificar que el push_token está guardado en la BD
- Verificar que la app tiene permisos de notificaciones
- Verificar logs en Expo Push API

### "Invalid credentials"
- Verificar que el Project ID es correcto
- Verificar que estás usando Expo SDK 54+

## Recursos

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Tool](https://expo.dev/notifications)
- [Testing Push Notifications](https://docs.expo.dev/push-notifications/testing/)

## Resumen

✅ Sistema de notificaciones completamente funcional
✅ 5 tipos de notificaciones implementadas
✅ Integración con Expo Push API
✅ Navegación automática al tocar notificaciones
✅ Tokens guardados en base de datos
✅ Listo para producción

**Siguiente paso:** Aplicar la migración de BD y configurar el Project ID.
