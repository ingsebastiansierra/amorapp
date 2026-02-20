# Guía de Depuración de AdMob

## Problema Actual
El anuncio intersticial no se está mostrando en la app.

## Posibles Causas y Soluciones

### 1. ✅ Verificar que AdMob esté inicializado
**Estado:** ✅ Configurado en `app/_layout.tsx`

### 2. ⚠️ Verificar google-services.json
**Estado:** ⚠️ El archivo actual NO tiene la configuración de AdMob

**Solución:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto "palpitos-ef369"
3. Ve a Configuración del proyecto (⚙️)
4. En la pestaña "General", baja hasta "Tus apps"
5. Haz clic en tu app Android
6. Descarga el nuevo `google-services.json`
7. Reemplaza el archivo actual en la raíz del proyecto

### 3. 🔧 Verificar IDs de AdMob
**IDs Configurados:**
- App ID: `ca-app-pub-6948900650863718~6879672767`
- Rewarded Ad: `ca-app-pub-6948900650863718/8071676377`
- Interstitial Ad: `ca-app-pub-6948900650863718/2854203030`

**Verificar en AdMob Console:**
1. Ve a [AdMob Console](https://apps.admob.com/)
2. Verifica que estos IDs existan y estén activos
3. Asegúrate de que las unidades de anuncios estén habilitadas

### 4. 🧪 Usar IDs de Prueba (Recomendado para desarrollo)
Para probar sin esperar aprobación de AdMob, usa estos IDs de prueba:

```typescript
// src/core/config/admob.ts
export const ADMOB_REWARDED_ID = __DEV__ 
  ? 'ca-app-pub-3940256099942544/5224354917' // ID de prueba
  : 'ca-app-pub-6948900650863718/8071676377'; // ID real

export const ADMOB_INTERSTITIAL_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/1033173712' // ID de prueba
  : 'ca-app-pub-6948900650863718/2854203030'; // ID real
```

### 5. 📱 Rebuild de la App
Después de cambiar `google-services.json` o configuración de AdMob:

```bash
# Limpiar cache
npx expo start -c

# O rebuild completo
cd android
./gradlew clean
cd ..
npx expo run:android
```

### 6. 🔍 Verificar Logs
Busca estos mensajes en los logs:

**Éxito:**
```
✅ AdMob inicializado correctamente
✅ Anuncio intersticial cargado
```

**Error común:**
```
❌ AdMob initialization failed
❌ Error mostrando anuncio intersticial
```

### 7. 🧪 Botón de Prueba
He agregado un botón de prueba en la pantalla de Perfil:
- Ve a Perfil en la app
- Verás un botón "Mostrar Anuncio Intersticial"
- El botón muestra el estado del anuncio (Cargando/Listo/No disponible)

### 8. ⏰ Tiempo de Aprobación
Si usas IDs reales (no de prueba):
- Las nuevas unidades de anuncios pueden tardar **hasta 24 horas** en activarse
- Mientras tanto, no se mostrarán anuncios
- Usa IDs de prueba durante el desarrollo

## Checklist de Verificación

- [ ] AdMob inicializado en `app/_layout.tsx`
- [ ] IDs de anuncios configurados en `src/core/config/admob.ts`
- [ ] `google-services.json` actualizado con AdMob
- [ ] App rebuildeada después de cambios
- [ ] Unidades de anuncios activas en AdMob Console
- [ ] Probado con IDs de prueba
- [ ] Verificado logs de la app

## Próximos Pasos

1. **Inmediato:** Cambiar a IDs de prueba para verificar que el código funciona
2. **Después:** Actualizar `google-services.json` desde Firebase Console
3. **Finalmente:** Esperar aprobación de unidades de anuncios reales (24h)
