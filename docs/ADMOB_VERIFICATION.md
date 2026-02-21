# Verificación de AdMob - Guía Paso a Paso

## 🎯 Objetivo
Verificar si Google AdMob ya activó los anuncios reales para tu app.

---

## 📋 Checklist Rápido

### ✅ Configuración Actual (YA HECHO)
- [x] IDs de AdMob configurados en el código
- [x] `USE_TEST_ADS = false` (anuncios reales activados)
- [x] App ID en `app.json` y `AndroidManifest.xml`
- [x] Fallback implementado para cuando no hay anuncios

### ⏳ Pendiente de Verificar
- [ ] App publicada en Play Store
- [ ] Han pasado 24-48 horas desde la publicación
- [ ] Unidades de anuncios activas en AdMob Console
- [ ] Sin restricciones en la cuenta de AdMob

---

## 🔍 Paso 1: Verificar AdMob Console

### 1.1 Acceder a AdMob
1. Ve a: https://apps.admob.com/
2. Inicia sesión con tu cuenta de Google
3. Selecciona tu app "MoodPareja"

### 1.2 Verificar Estado de la App
En el dashboard principal, verifica:

**Estado de la App:**
- ✅ **Activa**: Todo bien, continúa al siguiente paso
- ⚠️ **Pendiente**: Espera 24-48 horas
- ❌ **Suspendida**: Revisa el email de Google para ver el motivo

### 1.3 Verificar Unidades de Anuncios
Ve a: **Apps > MoodPareja > Unidades de anuncios**

Deberías ver 4 unidades:

| Nombre | Tipo | ID | Estado Esperado |
|--------|------|-----|-----------------|
| Recompensas Premium | Rewarded | 8071676377 | ✅ Activo |
| Intersticial Ocasional | Interstitial | 2854203030 | ✅ Activo |
| Banner Perfil | Banner | 2740865061 | ✅ Activo |
| Native Galería Fotos | Native | 8661336338 | ✅ Activo |

**Estados posibles:**
- ✅ **Activo**: Listo para servir anuncios
- ⏳ **Pendiente**: Esperando aprobación (24-48 horas)
- ⚠️ **Limitado**: Hay restricciones (revisa el motivo)
- ❌ **Inactivo**: Desactivado (actívalo manualmente)

### 1.4 Verificar Métricas
Ve a: **Informes > Descripción general**

Si ves datos aquí, significa que los anuncios están funcionando:
- **Solicitudes de anuncios**: Cuántas veces se solicitó un anuncio
- **Impresiones**: Cuántas veces se mostró un anuncio
- **Tasa de relleno**: % de solicitudes que se llenaron con anuncios

**Si no ves datos:**
- Puede ser que aún no haya suficiente tráfico
- O que los anuncios aún no estén activos

---

## 📱 Paso 2: Verificar en Play Console

### 2.1 Acceder a Play Console
1. Ve a: https://play.google.com/console/
2. Selecciona "MoodPareja"

### 2.2 Verificar Estado de Publicación
Ve a: **Producción > Países/regiones**

Verifica:
- ✅ App publicada y disponible
- ✅ Sin advertencias de monetización
- ✅ Sin restricciones de anuncios

### 2.3 Verificar Política de Contenido
Ve a: **Política > Estado de la app**

Busca advertencias relacionadas con:
- Anuncios
- Contenido inapropiado
- Violaciones de políticas

---

## 🧪 Paso 3: Probar los Anuncios

### 3.1 Instalar la App desde Play Store
**IMPORTANTE**: Instala la versión de producción desde Play Store, NO desde Android Studio.

```bash
# Desinstala cualquier versión de desarrollo
adb uninstall com.palpitos.app

# Instala desde Play Store
# (Busca "MoodPareja" en Play Store e instala)
```

### 3.2 Probar Anuncios Recompensados
1. Abre la app
2. Ve a **Perfil > Personalización**
3. Intenta desbloquear un tema premium
4. Observa qué sucede:

**Resultado Esperado:**
- ✅ Se muestra un anuncio real de Google
- ✅ Después del anuncio, el tema se desbloquea

**Si no funciona:**
- ⏳ Espera 24-48 horas si la app se publicó recientemente
- 📧 Revisa tu email por notificaciones de AdMob
- 🔍 Verifica los logs en Android Studio

### 3.3 Probar Anuncios en Galería
1. Ve a **Galería Privada**
2. Sube una foto
3. Observa si aparecen anuncios entre las fotos

**Resultado Esperado:**
- ✅ Anuncios nativos o banners entre las fotos
- ✅ Anuncios intersticiales al subir fotos

---

## 📊 Paso 4: Revisar Logs

### 4.1 Conectar Dispositivo y Ver Logs
```bash
# Conecta tu dispositivo Android
adb devices

# Ver logs en tiempo real
adb logcat | grep -E "AdMob|Rewarded|Interstitial|Banner"
```

### 4.2 Logs Esperados

**Cuando los anuncios funcionan:**
```
✅ AdMob inicializado correctamente
🎬 Inicializando anuncio recompensado con ID: ca-app-pub-6948900650863718/8071676377
✅ Anuncio recompensado cargado exitosamente
```

**Cuando los anuncios NO funcionan:**
```
❌ Error cargando anuncio recompensado: No fill
⚠️ AdMob: No ads available
```

**"No fill" significa:**
- No hay anuncios disponibles en este momento
- Puede ser temporal (intenta más tarde)
- O que AdMob aún no activó los anuncios para tu app

---

## ⚠️ Problemas Comunes

### Problema 1: "No fill" o "No ads available"

**Causas posibles:**
1. **Tiempo**: Han pasado menos de 48 horas desde la publicación
2. **Tráfico**: La app tiene muy pocas instalaciones
3. **Región**: No hay anuncios disponibles en tu país
4. **Cuenta nueva**: AdMob necesita tiempo para "aprender" sobre tu app

**Solución:**
- Espera 48 horas
- Consigue más instalaciones (mínimo 100 recomendado)
- Prueba desde diferentes dispositivos/regiones

### Problema 2: Cuenta de AdMob suspendida

**Síntomas:**
- Email de Google AdMob sobre suspensión
- No se cargan anuncios
- Mensaje de "cuenta deshabilitada"

**Solución:**
1. Lee el email de Google cuidadosamente
2. Corrige el problema mencionado
3. Apela la suspensión si crees que es un error
4. Contacta soporte de AdMob

### Problema 3: Anuncios solo en modo de prueba

**Síntomas:**
- Los anuncios de prueba funcionan
- Los anuncios reales no funcionan

**Solución:**
1. Verifica que `USE_TEST_ADS = false` en `admob.ts`
2. Compila una nueva versión de producción
3. Sube a Play Store
4. Espera 24-48 horas

---

## 📧 Paso 5: Contactar Soporte (Si es necesario)

### Cuándo contactar soporte:
- Han pasado más de 72 horas y no hay anuncios
- La cuenta está suspendida sin motivo claro
- Los anuncios funcionaban y dejaron de funcionar

### Cómo contactar:
1. Ve a: https://support.google.com/admob/
2. Selecciona: **Contactar con el equipo de asistencia**
3. Proporciona:
   - ID de la app: `ca-app-pub-6948900650863718~6879672767`
   - Descripción del problema
   - Capturas de pantalla de AdMob Console
   - Logs de la app

### Información a incluir:
```
App Name: MoodPareja
Package: com.palpitos.app
AdMob App ID: ca-app-pub-6948900650863718~6879672767
Play Store URL: [Tu URL de Play Store]
Fecha de publicación: [Fecha]
Problema: Los anuncios reales no se cargan después de [X] días
```

---

## ✅ Checklist Final

Antes de contactar soporte, verifica:

- [ ] Han pasado al menos 48 horas desde la publicación
- [ ] La app está publicada y disponible en Play Store
- [ ] Las unidades de anuncios están en estado "Activo" en AdMob
- [ ] No hay suspensiones o advertencias en AdMob Console
- [ ] `USE_TEST_ADS = false` en el código
- [ ] Probaste con la versión de Play Store (no desarrollo)
- [ ] Probaste desde diferentes dispositivos
- [ ] Revisaste los logs de la app
- [ ] Revisaste tu email por notificaciones de Google

---

## 🎯 Resumen

### Si los anuncios funcionan:
✅ ¡Perfecto! Tu app está monetizando correctamente.

### Si los anuncios NO funcionan:
1. **Menos de 48 horas**: ESPERA, es normal
2. **Más de 48 horas**: Sigue esta guía paso a paso
3. **Más de 72 horas**: Contacta soporte de AdMob

### Mientras tanto:
- El fallback otorga recompensas gratis a los usuarios
- Los usuarios pueden usar la app normalmente
- No pierdes funcionalidad

---

## 📞 Enlaces Útiles

- **AdMob Console**: https://apps.admob.com/
- **Play Console**: https://play.google.com/console/
- **Soporte AdMob**: https://support.google.com/admob/
- **Políticas de AdMob**: https://support.google.com/admob/answer/6128543
- **Estado de AdMob**: https://status.google.com/

---

**Última actualización**: Febrero 2026
**Versión de la app**: 1.0.0
