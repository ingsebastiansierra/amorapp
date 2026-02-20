# 🎉 Guía: Cuando AdMob Active tus Anuncios

## ✅ Estado Actual

**Código:** ✅ Completamente configurado y listo
**IDs de AdMob:** ⏳ Esperando activación (24-48 horas)
**Anuncios de Prueba:** ✅ Habilitados en producción (temporal)

### ⚠️ IMPORTANTE: Configuración Temporal

En `src/core/config/admob.ts` hay una variable:

```typescript
const USE_TEST_ADS = true;  // ← Cambia a false cuando AdMob active tus anuncios
```

**Mientras `USE_TEST_ADS = true`:**
- ✅ Verás anuncios de prueba en producción
- ✅ Puedes probar que todo funciona
- ❌ NO genera ingresos reales

**Cuando cambies a `USE_TEST_ADS = false`:**
- ✅ Usará tus IDs reales
- ✅ Generará ingresos reales 💰
- ⚠️ Solo hazlo cuando AdMob active tus anuncios (24-48h)

### Tus IDs Reales Configurados:

1. **Rewarded Ad (Recompensas Premium)**
   - ID: `ca-app-pub-6948900650863718/8071676377`
   - Ubicación: Pantalla de temas (desbloquear temas premium)

2. **Interstitial Ad (Intersticial Ocasional)**
   - ID: `ca-app-pub-6948900650863718/2854203030`
   - Ubicación: Al subir fotos privadas

3. **Banner Ad (Banner Perfil)**
   - ID: `ca-app-pub-6948900650863718/2740865061`
   - Ubicación: Parte inferior del Home (siempre visible)

---

## 🚀 Cuando AdMob Active los Anuncios

### ✅ Paso 1: Verificar Activación

Ve a: https://apps.admob.com/

Verifica que las 3 unidades de anuncios muestren:
- Estado: **Activo** ✅
- Solicitudes: **Recibiendo tráfico** ✅

### ✅ Paso 2: Cambiar a IDs Reales

Edita `src/core/config/admob.ts`:

```typescript
const USE_TEST_ADS = false;  // ← Cambia de true a false
```

### ✅ Paso 3: Recompilar

```bash
eas build --platform android --profile production
```

¡Y listo! Ahora usará tus anuncios reales y generará ingresos 💰

---

## 🧪 Cómo Verificar que Funciona

### En Desarrollo (Ahora)
```bash
npm start
```
- Verás anuncios de prueba de Google
- Funcionan perfectamente para probar la funcionalidad
- NO generan ingresos (son de prueba)

### En Producción (Después de activación)
```bash
eas build --platform android --profile production
```
- Verás tus anuncios reales
- Generan ingresos reales 💰
- Estadísticas en AdMob Console

---

## 📊 Monitoreo de Ingresos

Una vez activados, puedes ver estadísticas en:

**AdMob Console:** https://apps.admob.com/

Métricas importantes:
- **Impresiones**: Cuántas veces se mostró el anuncio
- **Clics**: Cuántas veces lo tocaron
- **CTR**: Porcentaje de clics (Click-Through Rate)
- **eCPM**: Ingresos por cada 1000 impresiones
- **Ingresos**: Dinero ganado 💰

---

## 🎯 Estrategia de Monetización Configurada

### Banner Ad (Ingresos Pasivos) 💵
- **Ubicación**: Home (siempre visible)
- **Frecuencia**: Se actualiza cada 30-60 segundos
- **Potencial**: Alto (usuarios pasan mucho tiempo aquí)
- **Experiencia**: No interrumpe

### Interstitial Ad (Ingresos por Acción) 📺
- **Ubicación**: Al subir fotos privadas
- **Frecuencia**: Cada vez que suben una foto
- **Potencial**: Medio-Alto (acción frecuente)
- **Experiencia**: Breve interrupción aceptable

### Rewarded Ad (Ingresos + Engagement) 🎁
- **Ubicación**: Desbloquear temas premium
- **Frecuencia**: Voluntario (usuario decide)
- **Potencial**: Alto (usuarios motivados ven el anuncio completo)
- **Experiencia**: Positiva (reciben recompensa)

---

## ⚠️ Importante

### Durante las Primeras 24-48 Horas:

1. **Los anuncios pueden no aparecer** - Es normal, están en proceso de activación
2. **Pueden aparecer pocos anuncios** - El sistema está aprendiendo
3. **Los ingresos serán bajos** - Se optimizan con el tiempo

### Después de 1 Semana:

- Los anuncios se mostrarán consistentemente
- Los ingresos se estabilizarán
- Las métricas serán más precisas

---

## 🔧 Troubleshooting

### Si los anuncios no aparecen después de 48h:

1. **Verifica en AdMob Console:**
   - ¿Las unidades están activas?
   - ¿Hay errores o advertencias?

2. **Verifica el google-services.json:**
   - Debe estar actualizado desde Firebase Console
   - Debe incluir la configuración de AdMob

3. **Verifica los logs de la app:**
   ```
   ✅ AdMob inicializado correctamente
   ✅ Banner ad loaded
   ✅ Anuncio intersticial cargado
   ```

4. **Rebuild la app:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   eas build --platform android --profile production
   ```

---

## 📞 Soporte

Si después de 48 horas los anuncios no funcionan:

1. Revisa el estado en AdMob Console
2. Verifica que el App ID esté correcto en `app.json`
3. Asegúrate de estar usando la versión de producción (no desarrollo)

---

## ✨ Resumen

**TL;DR:**
- ✅ Código listo
- ⏳ Espera 24-48h para activación de AdMob
- 🚀 Compila versión de producción
- 💰 Empieza a ganar dinero automáticamente

**No necesitas tocar el código nuevamente.** Todo está configurado para funcionar automáticamente cuando AdMob active tus anuncios.
