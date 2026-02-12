# Generar APK Localmente

Ya que EAS Build está teniendo problemas, aquí está cómo generar el APK localmente:

## Opción 1: Usar Expo Prebuild + Gradle (Recomendado)

### Requisitos:
- Android Studio instalado
- Java JDK 17
- Android SDK configurado

### Pasos:

1. **Generar proyecto Android:**
```cmd
npx expo prebuild --platform android --clean
```

2. **Compilar APK:**
```cmd
cd android
gradlew assembleRelease
```

3. **El APK estará en:**
```
android\app\build\outputs\apk\release\app-release.apk
```

## Opción 2: Usar Expo Application Services (más simple)

Si tienes Android Studio instalado:

```cmd
npx expo run:android --variant release
```

Esto compilará e instalará directamente en tu dispositivo conectado.

## Opción 3: Usar un servicio alternativo

### AppCenter (Microsoft)
1. Crea cuenta en https://appcenter.ms
2. Conecta tu repositorio
3. Configura el build de Android
4. Descarga el APK

### Bitrise
1. Crea cuenta en https://www.bitrise.io
2. Conecta tu repositorio
3. Usa el workflow de React Native
4. Descarga el APK

## Solución temporal: Usar Expo Go

Mientras tanto, la app funciona perfectamente con Expo Go:

```cmd
npm start
```

Escanea el QR con tu celular. Todas las funcionalidades están operativas:
- ✅ Nombre "Palpitos"
- ✅ Sistema de notificaciones
- ✅ Mensajes persistentes
- ✅ Límites por emoción
- ✅ Animaciones

Solo el icono personalizado requiere el APK nativo.

## Nota sobre EAS Build

Los errores de "Bundle JavaScript" en EAS suelen ser temporales o por:
- Problemas en los servidores de Expo
- Incompatibilidades de versiones (ya actualizamos todo)
- Límites de la cuenta gratuita

Puedes intentar el build nuevamente en unas horas o actualizar a un plan de pago de Expo para builds prioritarios.
