# 🎯 Guía Rápida: Sistema de Anuncios Inteligente

## ¿Qué Hicimos?

Implementamos un sistema donde **si un anuncio no funciona, automáticamente se activa otro tipo**. Así nunca pierdes dinero por anuncios que no cargan.

---

## 🔄 Cómo Funciona

### Ejemplo 1: Banner en Home
```
1. Intenta mostrar Banner Adaptativo Grande
   ❌ Falla (sin inventario)
   
2. Intenta mostrar Banner Normal
   ✅ Funciona → Usuario ve el anuncio
```

### Ejemplo 2: Subir Foto en Galería
```
1. Intenta mostrar Intersticial
   ❌ Falla (sin inventario)
   
2. Muestra Banner en Modal
   ✅ Funciona → Usuario ve el anuncio
```

### Ejemplo 3: Desbloquear Tema Premium
```
1. Intenta mostrar Anuncio Recompensado
   ❌ Falla (sin inventario)
   
2. Muestra Intersticial + Mensaje al usuario
   ❌ También falla
   
3. Da la recompensa gratis
   ✅ Usuario feliz, no pierde funcionalidad
```

---

## 📍 Dónde Están los Anuncios

| Pantalla | Ubicación | Tipo |
|----------|-----------|------|
| **Home** | Parte inferior | Banner (siempre visible) |
| **Galería** | Al subir foto | Intersticial (popup) |
| **Galería** | Entre fotos (cada 6) | Native/Banner |
| **Temas** | Desbloquear premium | Recompensado |

---

## 🎮 Modo Desarrollo vs Producción

### Desarrollo (`__DEV__ = true`)
- Usa anuncios de prueba de Google
- No genera dinero real
- Para testing

### Producción (`__DEV__ = false`)
- Usa tus IDs reales de AdMob
- Genera dinero real
- Detectado automáticamente

**No necesitas cambiar nada en el código**, la app detecta sola en qué modo está.

---

## 💰 Tus IDs de AdMob (Reales)

```
Recompensado: ca-app-pub-6948900650863718/8071676377
Intersticial: ca-app-pub-6948900650863718/2854203030
Banner:       ca-app-pub-6948900650863718/2740865061
Native:       ca-app-pub-6948900650863718/8661336338
```

Todos configurados en: `src/core/config/admob.ts`

---

## 🔍 Cómo Verificar que Funciona

### En Desarrollo (Expo Go)
Verás anuncios de prueba con texto "Test Ad"

### En Producción (APK/AAB)
1. Compila la app en modo release
2. Instala en un dispositivo real
3. Los anuncios reales aparecerán automáticamente

### Logs en Consola
```
✅ Banner cargado (intento 1)
⚠️ Banner intento 1 falló: no-fill
✅ Banner cargado (intento 2)
```

---

## ⚠️ Importante: Native Ad

El Native Ad (`8661336338`) es nuevo y puede tardar **24-48 horas** en activarse en AdMob.

**Mientras tanto:**
- SmartGalleryAd intentará usar Native
- Si falla, usará Banner automáticamente
- No necesitas hacer nada

**Cuando se active:**
- Funcionará automáticamente
- Verás en logs: `✅ Anuncio de galería cargado (Native)`

---

## 🚀 Archivos Modificados

### Nuevos Componentes Smart
- ✅ `src/shared/components/SmartBannerAd.tsx`
- ✅ `src/shared/components/SmartGalleryAd.tsx`
- ✅ `src/shared/hooks/useSmartInterstitialAd.ts`
- ✅ `src/shared/hooks/useSmartRewardedAd.ts`

### Pantallas Actualizadas
- ✅ `app/(app)/home.tsx` → Usa SmartBannerAd
- ✅ `src/features/gallery/PersonalGalleryScreen.tsx` → Usa SmartInterstitialAd y SmartGalleryAd
- ✅ `app/(app)/theme-settings.tsx` → Usa SmartRewardedAd

---

## 🎯 Ventajas

1. **Nunca pierdes dinero** - Siempre intenta mostrar algo
2. **Mejor experiencia** - No muestra errores al usuario
3. **Automático** - No necesitas intervenir
4. **Logs claros** - Sabes qué está pasando
5. **Listo para producción** - IDs reales activados

---

## 📊 Próximos Pasos

1. **Espera 24-48h** para que Native Ad se active
2. **Compila en release** para ver anuncios reales
3. **Monitorea AdMob** para ver impresiones y ganancias
4. **Revisa logs** si algo no funciona

---

## 🆘 Si Algo No Funciona

### Anuncios no aparecen en producción
1. Verifica que `USE_TEST_ADS = false` en `admob.ts`
2. Compila en modo release (no debug)
3. Espera unos minutos (AdMob puede tardar)

### Logs muestran "no-fill"
- Normal, significa que no hay inventario disponible
- El sistema intentará otro tipo automáticamente
- No es un error

### Native Ad no funciona
- Es nuevo, espera 24-48h
- Mientras tanto usa Banner (automático)
- No requiere acción de tu parte

---

## ✅ Todo Listo

El sistema está completamente implementado y funcionando. Los anuncios se adaptarán automáticamente según disponibilidad.

**¡Disfruta tus ingresos! 💰**
