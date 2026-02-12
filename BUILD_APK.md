# Cómo generar el APK de Palpitos

## Estado actual del build
El build está en progreso en EAS. Puedes ver el estado aquí:
https://expo.dev/accounts/sebasing/projects/palpitos/builds/ceb336d0-a997-4242-9b28-28fc8bd1c9d0

## Si el build falla nuevamente

### Opción 1: Usar Expo Go (más rápido, sin icono personalizado)
```cmd
npm start
```
Escanea el QR con Expo Go en tu celular. La app funcionará perfectamente pero con el icono genérico de Expo Go.

### Opción 2: Build local (requiere Android Studio)
1. Instala Android Studio: https://developer.android.com/studio
2. Configura las variables de entorno de Android SDK
3. Ejecuta:
```cmd
npx expo prebuild
npx expo run:android
```

### Opción 3: Usar un servicio alternativo
Puedes usar servicios como:
- **Appetize.io** - Para probar en navegador
- **BrowserStack** - Para testing en dispositivos reales
- **Expo Snack** - Para compartir y probar rápidamente

## Problemas comunes

### Error de Gradle
El error de Gradle suele ser por:
- Dependencias desactualizadas (ya configuramos `.npmrc` para solucionarlo)
- Versiones incompatibles de paquetes
- Problemas de memoria en el servidor de build

### Solución temporal
Mientras se soluciona el build, puedes:
1. Usar Expo Go para desarrollo y pruebas
2. El nombre "Palpitos" ya está actualizado en todas las pantallas
3. Todas las funcionalidades están operativas
4. Solo el icono personalizado requiere el APK nativo

## Archivos configurados
✅ `eas.json` - Configuración de build
✅ `app.json` - Configuración de la app
✅ `android/gradle.properties` - Propiedades de Gradle
✅ `android/build.gradle` - Configuración de build de Android
✅ `.npmrc` - Configuración de npm para dependencias
✅ Iconos en `assets/` - Listos para el build

## Próximos pasos
1. Espera a que termine el build actual (10-15 minutos)
2. Si falla, revisa los logs en el link de arriba
3. Si es necesario, podemos intentar con un build de desarrollo en lugar de preview
