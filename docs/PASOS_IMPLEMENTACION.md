# 📋 Guía Paso a Paso - Implementación de Seguridad

## ✅ Archivos Creados

Ya creé estos archivos en tu proyecto:
- ✅ `supabase/migrations/012_rate_limiting.sql`
- ✅ `supabase/migrations/013_data_validation.sql`
- ✅ `src/shared/utils/sanitize.ts`
- ✅ `src/shared/hooks/useRateLimit.ts`

---

## 🎯 PASO 1: Ejecutar SQL en Supabase (5 minutos)

### 1.1 Abrir Supabase Dashboard
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto "Palpitos"
3. Click en "SQL Editor" en el menú lateral

### 1.2 Ejecutar Rate Limiting
1. Click en "New Query"
2. Abre el archivo `supabase/migrations/012_rate_limiting.sql`
3. Copia TODO el contenido
4. Pégalo en el editor de Supabase
5. Click en "Run" (botón verde)
6. Deberías ver: "Success. No rows returned"

### 1.3 Ejecutar Validaciones
1. Click en "New Query" otra vez
2. Abre el archivo `supabase/migrations/013_data_validation.sql`
3. Copia TODO el contenido
4. Pégalo en el editor de Supabase
5. Click en "Run"
6. Deberías ver: "Success. No rows returned"

**✅ Listo! Ahora tu base de datos tiene protección contra spam**

---

## 🎯 PASO 2: Implementar en el Código (15 minutos)

### 2.1 Actualizar Home Screen (Mensajes Sincronizados)

Abre `app/(app)/home.tsx` y busca la función `handleSendSyncMessage`.

**ANTES:**
```typescript
const handleSendSyncMessage = async () => {
    if (!syncMessage.trim() || !partner || !user || !myState) {
        return;
    }
```

**DESPUÉS:**
```typescript
import { useRateLimit } from '@/shared/hooks/useRateLimit';
import { sanitizeMessage } from '@/shared/utils/sanitize';

// Agregar al inicio del componente (después de los otros hooks)
const { checkLimit: checkMessageLimit } = useRateLimit({
    maxAttempts: 5,
    windowMs: 60000, // 1 minuto
    message: 'Espera un momento antes de enviar otro mensaje'
});

const handleSendSyncMessage = async () => {
    // Verificar rate limit
    if (!checkMessageLimit()) {
        return;
    }

    // Sanitizar mensaje
    const cleanMessage = sanitizeMessage(syncMessage);
    
    if (!cleanMessage || !partner || !user || !myState) {
        Alert.alert('Error', 'El mensaje no puede estar vacío');
        return;
    }

    // Verificar si se alcanzó el límite
    if (emotionBlocked) {
        return;
    }

    try {
        // ... resto del código (usar cleanMessage en lugar de syncMessage.trim())
        const { data, error } = await supabase
            .from('sync_messages')
            .insert({
                couple_id: userData.couple_id,
                from_user_id: user.id,
                to_user_id: partner.id,
                message: cleanMessage, // <-- CAMBIAR AQUÍ
                synced_emotion: myState,
            })
            .select();
```

### 2.2 Actualizar Selector de Estado Emocional

Abre `app/(app)/home.tsx` y busca `handleStateSelect`.

**AGREGAR al inicio del componente:**
```typescript
const { checkLimit: checkStateLimit } = useRateLimit({
    maxAttempts: 10,
    windowMs: 60000, // 1 minuto
    message: 'Espera un momento antes de cambiar tu estado otra vez'
});
```

**MODIFICAR handleStateSelect:**
```typescript
const handleStateSelect = async (state: EmotionalState) => {
    // Verificar rate limit
    if (!checkStateLimit()) {
        return;
    }

    await setMyState(state, 1);
    setShowStateSelector(false);

    // ... resto del código
};
```

### 2.3 Actualizar Subida de Imágenes

Abre `src/features/gallery/PersonalGalleryScreen.tsx`.

**AGREGAR al inicio:**
```typescript
import { useRateLimit } from '@/shared/hooks/useRateLimit';
import { sanitizeCaption } from '@/shared/utils/sanitize';

// Dentro del componente
const { checkLimit: checkUploadLimit } = useRateLimit({
    maxAttempts: 10,
    windowMs: 3600000, // 1 hora
    message: 'Has subido muchas fotos. Espera un momento.'
});
```

**MODIFICAR handleConfirmUpload:**
```typescript
const handleConfirmUpload = async () => {
    if (!user || !selectedImage) return;

    // Verificar rate limit
    if (!checkUploadLimit()) {
        return;
    }

    setUploading(true);
    try {
        // Sanitizar caption
        const cleanCaption = caption.trim() ? sanitizeCaption(caption) : undefined;

        await galleryService.uploadPhoto(user.id, selectedImage, {
            caption: cleanCaption, // <-- CAMBIAR AQUÍ
            visibility,
        });

        // ... resto del código
```

### 2.4 Actualizar Creación de Eventos

Abre `app/(app)/calendar.tsx`.

**AGREGAR al inicio:**
```typescript
import { useRateLimit } from '@/shared/hooks/useRateLimit';
import { sanitizeText, sanitizeLocation } from '@/shared/utils/sanitize';

// Dentro del componente
const { checkLimit: checkEventLimit } = useRateLimit({
    maxAttempts: 10,
    windowMs: 3600000, // 1 hora
    message: 'Has creado muchos eventos. Espera un momento.'
});
```

**MODIFICAR handleCreateEvent:**
```typescript
const handleCreateEvent = async () => {
    // Sanitizar inputs
    const cleanTitle = sanitizeText(title, 100);
    const cleanDescription = description.trim() ? sanitizeText(description, 500) : undefined;
    const cleanLocation = location.trim() ? sanitizeLocation(location) : undefined;

    if (!cleanTitle || !coupleId || !user) {
        Alert.alert('Error', 'Por favor completa el título del evento');
        return;
    }

    // Verificar rate limit solo para nuevos eventos
    if (!editingEvent && !checkEventLimit()) {
        return;
    }

    try {
        const eventData: CreateEventData = {
            title: cleanTitle, // <-- CAMBIAR
            description: cleanDescription, // <-- CAMBIAR
            event_date: selectedDate.toISOString(),
            event_type: eventType,
            location: cleanLocation, // <-- CAMBIAR
            reminder_enabled: true,
        };

        // ... resto del código
```

---

## 🎯 PASO 3: Configurar Ofuscación (5 minutos)

### 3.1 Editar build.gradle

Abre `android/app/build.gradle` y busca `buildTypes`.

**CAMBIAR de:**
```gradle
buildTypes {
    release {
        // ... otras configuraciones
    }
}
```

**A:**
```gradle
buildTypes {
    release {
        // Habilitar ofuscación
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        
        // ... otras configuraciones existentes
    }
}
```

### 3.2 Crear/Editar proguard-rules.pro

Abre o crea `android/app/proguard-rules.pro`:

```proguard
# Mantener clases de React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Mantener clases de Expo
-keep class expo.** { *; }
-keep class versioned.** { *; }

# Mantener clases de Supabase
-keep class io.supabase.** { *; }

# Mantener clases de Google Mobile Ads
-keep class com.google.android.gms.ads.** { *; }

# Ofuscar todo lo demás
-repackageclasses
-allowaccessmodification
```

---

## ✅ PASO 4: Probar Todo (5 minutos)

### 4.1 Probar Rate Limiting
1. Abre la app
2. Intenta enviar 6 mensajes seguidos rápidamente
3. Deberías ver: "Espera un momento antes de enviar otro mensaje"

### 4.2 Probar Sanitización
1. Intenta escribir un mensaje con `<script>alert('test')</script>`
2. El mensaje debería guardarse sin el código malicioso

### 4.3 Probar Validación en BD
1. Intenta enviar un mensaje muy largo (más de 500 caracteres)
2. Debería fallar con error de Supabase

---

## 📊 Checklist Final

Marca lo que completaste:

### Base de Datos
- [ ] Ejecuté `012_rate_limiting.sql` en Supabase
- [ ] Ejecuté `013_data_validation.sql` en Supabase
- [ ] Verifiqué que no hubo errores

### Código
- [ ] Agregué rate limit a mensajes sincronizados
- [ ] Agregué rate limit a cambios de estado
- [ ] Agregué rate limit a subida de imágenes
- [ ] Agregué rate limit a creación de eventos
- [ ] Agregué sanitización a todos los inputs
- [ ] Probé que funciona correctamente

### Android
- [ ] Configuré ofuscación en build.gradle
- [ ] Creé proguard-rules.pro
- [ ] Compilé un APK de prueba

---

## 🎉 ¡Felicidades!

Si completaste todo, tu app ahora tiene:
- ✅ Protección contra spam (rate limiting)
- ✅ Validación de datos en BD
- ✅ Sanitización de inputs
- ✅ Código ofuscado en producción

**Nivel de Seguridad:** 🟢 8/10

---

## 🚨 Si Algo Sale Mal

### Error en Supabase SQL
- Verifica que copiaste TODO el código
- Asegúrate de que las tablas existen
- Revisa los logs de error en Supabase

### Error en el Código
- Verifica los imports
- Asegúrate de que los archivos existen
- Ejecuta `npm install` por si acaso

### La App No Compila
- Limpia el cache: `npx expo start --clear`
- Reinstala dependencias: `rm -rf node_modules && npm install`

---

## 📞 Siguiente Paso

Una vez que todo funcione, revisa `SEGURIDAD_APP.md` para implementar:
- Detección de root/jailbreak
- SSL pinning
- Biometría
