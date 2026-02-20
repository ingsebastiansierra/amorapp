# 🎨 Native Ads en Galería - Guía Completa

## ✅ Lo que Acabamos de Implementar

### 1. **Componente GalleryNativeAd**
- Anuncio nativo personalizado que se ve como parte de la galería
- Incluye imagen, título, descripción y botón de acción
- Badge de "Patrocinado" para transparencia
- Diseño que combina perfectamente con tus fotos

### 2. **Integración en la Galería**
- Native Ads aparecen cada 6 fotos
- Se insertan automáticamente en el grid
- No interrumpen la experiencia del usuario
- Funcionan con IDs de prueba ahora mismo

### 3. **Configuración de AdMob**
- ID de prueba configurado: Funciona YA
- Placeholder para ID real: Necesitas crearlo en AdMob Console

---

## 🚀 Cómo Crear el Native Ad en AdMob Console

### Paso 1: Ir a AdMob Console
Ve a: https://apps.admob.com/

### Paso 2: Seleccionar tu App
1. Click en "Aplicaciones" en el menú lateral
2. Selecciona "Palpitos" (com.palpitos.app)

### Paso 3: Crear Nueva Unidad de Anuncio
1. Click en "Unidades de anuncios"
2. Click en "AGREGAR UNIDAD DE ANUNCIOS"
3. Selecciona **"Nativo"** (NO banner, NO intersticial)

### Paso 4: Configurar la Unidad
**Nombre:** `Native Galería Fotos`

**Configuración:**
- Formato: Nativo
- Ubicación: Galería de fotos
- Tipo de contenido: Mixto

### Paso 5: Copiar el ID
Después de crear, verás algo como:
```
ca-app-pub-6948900650863718/XXXXXXXXXX
```

### Paso 6: Actualizar el Código
Edita `src/core/config/admob.ts`:

```typescript
export const ADMOB_NATIVE_ID = (IS_DEV || USE_TEST_ADS)
  ? 'ca-app-pub-3940256099942544/2247696110' // ID de prueba
  : 'ca-app-pub-6948900650863718/XXXXXXXXXX'; // ← Pega tu ID aquí
```

### Paso 7: Recompilar
```bash
eas build --platform android --profile production
```

---

## 💰 Proyección de Ingresos con Native Ads

### Escenario: 1,000 usuarios activos/día

**Sin Native Ads (Actual):**
- Banner: $1-2/día
- Interstitial: $0.50-1/día
- Rewarded: $0.50-1/día
- **Total: ~$2-4/día**

**Con Native Ads:**
- Banner: $1-2/día
- Interstitial: $0.50-1/día
- Rewarded: $0.50-1/día
- **Native: $3-8/día** ⭐
- **Total: ~$5-12/día**

**Aumento: +150% a +200%** 🚀

---

## 🎯 Cómo Funcionan los Native Ads

### Ubicación en tu App:
```
Galería de Fotos:

[Foto 1] [Foto 2]
[Foto 3] [Foto 4]
[Foto 5] [Foto 6]

┌─────────────────────────┐
│ 🎁 Patrocinado          │  ← Native Ad
│ [Imagen del anuncio]    │
│ Imprime tus recuerdos   │
│ [Ver ofertas →]         │
└─────────────────────────┘

[Foto 7] [Foto 8]
[Foto 9] [Foto 10]
```

### Por qué Pagan Más:
1. **Se ven naturales**: Parecen parte de la app
2. **Alta visibilidad**: Ocupan espacio completo
3. **Mejor engagement**: Los usuarios interactúan más
4. **Relevancia**: AdMob muestra anuncios relacionados con fotos/recuerdos

---

## 📊 Métricas Esperadas

### Comparación con otros formatos:

| Tipo | eCPM | CTR | Engagement |
|------|------|-----|------------|
| Banner | $0.25-$2 | 0.5-1% | Bajo |
| Interstitial | $3-$8 | 2-4% | Medio |
| Rewarded | $5-$15 | 100% | Alto |
| **Native** | **$4-$10** | **3-6%** | **Alto** |

### Ventajas del Native:
- ✅ No interrumpe (como intersticial)
- ✅ Siempre visible (como banner)
- ✅ Alta tasa de clics (como rewarded)
- ✅ Mejor experiencia de usuario

---

## 🧪 Probando los Native Ads

### Con IDs de Prueba (Ahora):
1. Abre la galería de fotos
2. Sube al menos 6 fotos
3. Verás un Native Ad después de la 6ta foto
4. El anuncio se ve como una tarjeta con:
   - Badge "Patrocinado"
   - Imagen
   - Título y descripción
   - Botón de acción

### Con IDs Reales (Después de crear en AdMob):
1. Crea la unidad en AdMob Console
2. Actualiza el ID en el código
3. Recompila la app
4. Los anuncios reales aparecerán automáticamente

---

## 🎨 Personalización del Diseño

El Native Ad está diseñado para:
- ✅ Coincidir con el estilo de tu app
- ✅ Usar tus colores (#FF6B9D)
- ✅ Tener bordes redondeados como tus fotos
- ✅ Incluir sombras sutiles

Si quieres cambiar el diseño, edita:
`src/shared/components/GalleryNativeAd.tsx`

---

## ⚠️ Importante

### Frecuencia de Anuncios:
- **Actual:** 1 Native Ad cada 6 fotos
- **Recomendado:** No cambiar (balance perfecto)
- **Máximo:** 1 cada 4 fotos (más puede molestar)

### Políticas de AdMob:
- ✅ Siempre incluir badge "Patrocinado"
- ✅ No ocultar que es publicidad
- ✅ No hacer que parezca contenido tuyo
- ❌ No poner demasiados anuncios

---

## 🚀 Próximos Pasos

1. **Ahora:** Prueba con IDs de prueba
2. **Hoy:** Crea la unidad Native en AdMob Console
3. **Mañana:** Actualiza el ID y recompila
4. **En 24-48h:** Empieza a ganar dinero con Native Ads 💰

---

## 💡 Tips para Maximizar Ingresos

### 1. Anima a los usuarios a subir más fotos
- Más fotos = Más Native Ads visibles
- Notificaciones: "Sube una foto de tu día"

### 2. Gamificación
- "Sube 10 fotos y desbloquea un tema"
- Más engagement = Más impresiones

### 3. Comparte la galería
- "Comparte tu galería con tu pareja"
- Más usuarios viendo = Más clics

---

## 📈 Resumen

**Lo que tienes ahora:**
- ✅ 3 tipos de anuncios (Banner, Interstitial, Rewarded)
- ✅ 4to tipo agregado (Native) ⭐
- ✅ Estrategia completa de monetización
- ✅ Código listo para producción

**Potencial de ingresos:**
- Con 1,000 usuarios: $5-12/día
- Con 5,000 usuarios: $25-60/día
- Con 10,000 usuarios: $50-120/día

**Próximo paso:**
Crear la unidad Native en AdMob Console y actualizar el ID.

¡Ya tienes la mejor estrategia de monetización para tu app! 🎉
