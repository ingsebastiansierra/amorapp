# 🎯 Sistema Inteligente de Anuncios con Fallback

## ✅ Implementación Completa

Hemos implementado un sistema inteligente de anuncios que **nunca pierde una oportunidad de monetización**. Si un tipo de anuncio falla, automáticamente intenta otro tipo.

---

## 🔄 Componentes Smart Implementados

### 1. **SmartBannerAd** (Banner Inteligente)
**Ubicación:** `src/shared/components/SmartBannerAd.tsx`

**Cadena de Fallback:**
1. `ANCHORED_ADAPTIVE_BANNER` (Adaptativo grande)
2. `BANNER` (Banner estándar)
3. `LARGE_BANNER` (Banner grande)

**Uso:**
```tsx
import { SmartBannerAd } from '@/shared/components/SmartBannerAd';

<SmartBannerAd />
```

**Implementado en:**
- ✅ `app/(app)/home.tsx` - Banner inferior de la pantalla principal

---

### 2. **useSmartInterstitialAd** (Intersticial Inteligente)
**Ubicación:** `src/shared/hooks/useSmartInterstitialAd.ts`

**Cadena de Fallback:**
1. Intersticial completo
2. Banner en modal (si intersticial falla)

**Características:**
- Si el intersticial no carga, muestra un banner en un modal
- El usuario puede cerrar el modal tocando el botón X
- Incluye componente `FallbackModal` que debe renderizarse

**Uso:**
```tsx
import { useSmartInterstitialAd } from '@/shared/hooks/useSmartInterstitialAd';

const { showAd, isLoaded, FallbackModal } = useSmartInterstitialAd();

// En el JSX
<FallbackModal />

// Para mostrar el anuncio
await showAd();
```

**Implementado en:**
- ✅ `src/features/gallery/PersonalGalleryScreen.tsx` - Al subir fotos

---

### 3. **useSmartRewardedAd** (Recompensado Inteligente)
**Ubicación:** `src/shared/hooks/useSmartRewardedAd.ts`

**Cadena de Fallback:**
1. Anuncio recompensado
2. Intersticial (con alerta explicativa)
3. Otorgar recompensa sin anuncio (si ambos fallan)

**Características:**
- Prioriza anuncios recompensados
- Si falla, ofrece intersticial con mensaje al usuario
- Si todo falla, otorga la recompensa de todos modos (mejor UX)

**Uso:**
```tsx
import { useSmartRewardedAd } from '@/shared/hooks/useSmartRewardedAd';

const handleReward = () => {
    // Lógica cuando el usuario gana la recompensa
};

const { showAd, isLoaded, isLoading } = useSmartRewardedAd(handleReward);

// Para mostrar el anuncio
await showAd();
```

**Implementado en:**
- ✅ `app/(app)/theme-settings.tsx` - Desbloquear temas premium

---

### 4. **SmartGalleryAd** (Anuncio de Galería Inteligente)
**Ubicación:** `src/shared/components/SmartGalleryAd.tsx`

**Cadena de Fallback:**
1. Native Ad (ID nativo)
2. Medium Rectangle con ID de banner
3. Banner estándar

**Características:**
- Intenta usar el Native Ad primero
- Si falla (nuevo, sin inventario), usa banner mediano
- Último recurso: banner estándar
- Incluye badge "Patrocinado"

**Uso:**
```tsx
import { SmartGalleryAd } from '@/shared/components/SmartGalleryAd';

<SmartGalleryAd />
```

**Implementado en:**
- ✅ `src/features/gallery/PersonalGalleryScreen.tsx` - Entre filas de fotos (cada 6 fotos)

---

## 🎮 Detección Automática de Entorno

El sistema detecta automáticamente si está en desarrollo o producción:

```typescript
// src/core/config/admob.ts
const IS_DEV = __DEV__;
const USE_TEST_ADS = false;

// En desarrollo: usa IDs de prueba
// En producción: usa IDs reales
export const ADMOB_BANNER_ID = (IS_DEV || USE_TEST_ADS)
  ? 'ca-app-pub-3940256099942544/6300978111' // Test
  : 'ca-app-pub-6948900650863718/2740865061'; // Real
```

**Comportamiento:**
- `__DEV__ = true` → Anuncios de prueba
- `__DEV__ = false` → Anuncios reales
- `USE_TEST_ADS = true` → Forzar anuncios de prueba (para testing)

---

## 📊 Ventajas del Sistema

### 1. **Maximiza Ingresos**
- Nunca muestra espacio vacío
- Siempre intenta mostrar algún anuncio
- Múltiples opciones de fallback

### 2. **Mejor Experiencia de Usuario**
- No muestra errores al usuario
- Transiciones suaves entre tipos de anuncios
- Otorga recompensas incluso si los anuncios fallan

### 3. **Logs Detallados**
```
✅ Banner cargado (intento 1)
⚠️ Banner intento 1 falló: no-fill
✅ Banner cargado (intento 2)
```

### 4. **Manejo Inteligente de Errores**
- Detecta cuando un anuncio no tiene inventario
- Cambia automáticamente a otro tipo
- No bloquea la funcionalidad de la app

---

## 🔧 Configuración de IDs

Todos los IDs están centralizados en `src/core/config/admob.ts`:

```typescript
// Anuncios Reales (Producción)
ADMOB_REWARDED_ID: 'ca-app-pub-6948900650863718/8071676377'
ADMOB_INTERSTITIAL_ID: 'ca-app-pub-6948900650863718/2854203030'
ADMOB_BANNER_ID: 'ca-app-pub-6948900650863718/2740865061'
ADMOB_NATIVE_ID: 'ca-app-pub-6948900650863718/8661336338'
```

---

## 📱 Ubicaciones de Anuncios

| Ubicación | Tipo | Componente | Fallback |
|-----------|------|------------|----------|
| Home (inferior) | Banner | SmartBannerAd | Adaptive → Banner → Large |
| Galería (subir foto) | Intersticial | useSmartInterstitialAd | Intersticial → Banner Modal |
| Galería (entre fotos) | Native/Banner | SmartGalleryAd | Native → Medium → Banner |
| Temas (desbloquear) | Recompensado | useSmartRewardedAd | Rewarded → Intersticial → Gratis |

---

## 🚀 Próximos Pasos

### Cuando el Native Ad se Active (24-48h)
El Native Ad (`ca-app-pub-6948900650863718/8661336338`) está recién creado y puede tardar en activarse.

**SmartGalleryAd ya está preparado:**
- Intenta Native primero
- Si falla, usa Banner automáticamente
- No requiere cambios de código

### Monitoreo
Revisa los logs en la consola:
```
✅ Anuncio de galería cargado (Native)
⚠️ Anuncio galería intento 1 (Native) falló: no-fill
✅ Anuncio de galería cargado (Medium Rectangle)
```

---

## 🎯 Resumen

✅ **4 tipos de anuncios** con fallback inteligente
✅ **Detección automática** de desarrollo/producción
✅ **Maximiza ingresos** sin perder oportunidades
✅ **Mejor UX** con manejo elegante de errores
✅ **Logs detallados** para debugging
✅ **Listo para producción** con IDs reales activados

El sistema está completamente implementado y funcionando. Los anuncios se adaptarán automáticamente según disponibilidad de inventario.
