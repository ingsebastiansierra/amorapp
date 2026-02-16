# Guía para Generar APK de Palpitos

## Requisitos Previos

1. ✅ Cuenta de Expo (ya configurada)
2. ✅ EAS CLI instalado
3. ✅ Proyecto configurado con `eas.json`

## Pasos para Generar el APK

### 1. Verificar que estás logueado en EAS

```bash
eas whoami
```

Si no estás logueado:
```bash
eas login
```

### 2. Generar el APK (Preview)

Para generar un APK de prueba:

```bash
eas build --platform android --profile preview
```

Este comando:
- Genera un APK (no AAB)
- Es para distribución interna
- Se puede instalar directamente en cualquier Android

### 3. Generar el APK (Production)

Para generar un APK de producción:

```bash
eas build --platform android --profile production
```

### 4. Seguir el proceso

El comando te preguntará:
1. **¿Generar un nuevo keystore?** → Sí (primera vez) o No (si ya tienes uno)
2. Subirá el código a los servidores de Expo
3. Compilará la app en la nube
4. Te dará un link para descargar el APK

### 5. Descargar el APK

Una vez completado el build:
1. Ve al link que te proporciona
2. O visita: https://expo.dev/accounts/[tu-usuario]/projects/palpitos/builds
3. Descarga el APK
4. Instálalo en tu dispositivo Android

## Comandos Útiles

### Ver el estado de los builds
```bash
eas build:list
```

### Cancelar un build en progreso
```bash
eas build:cancel
```

### Ver configuración del proyecto
```bash
eas build:configure
```

## Configuración Actual

### Preview Build
- **Tipo**: APK
- **Distribución**: Interna
- **Canal**: preview
- **Uso**: Para pruebas y desarrollo

### Production Build
- **Tipo**: APK
- **Distribución**: Producción
- **Uso**: Para distribución final

## Información del Proyecto

- **Nombre**: Palpitos
- **Package**: com.palpitos.app
- **Version**: 1.0.0
- **Version Code**: 1

## Permisos Incluidos

✅ Cámara (para fotos privadas)
✅ Galería (para seleccionar imágenes)
✅ Micrófono (para notas de voz)
✅ Notificaciones (para alertas)
✅ Vibración (para feedback háptico)
✅ Almacenamiento (para guardar archivos temporales)

## Notas Importantes

1. **Primera vez**: El build puede tardar 10-20 minutos
2. **Keystore**: Guarda el keystore que se genera, lo necesitarás para futuras actualizaciones
3. **Variables de entorno**: Asegúrate de que `.env` esté configurado correctamente
4. **Tamaño**: El APK final será de aproximadamente 50-80 MB

## Solución de Problemas

### Error: "No credentials found"
```bash
eas credentials
```
Luego selecciona "Android" y configura las credenciales.

### Error: "Build failed"
Revisa los logs en el dashboard de Expo para ver el error específico.

### Error: "Invalid package name"
Verifica que `app.json` tenga el `package` correcto en la sección `android`.

## Próximos Pasos Después del Build

1. Instala el APK en tu dispositivo
2. Prueba todas las funcionalidades:
   - Login/Registro
   - Vincular pareja
   - Estados emocionales
   - Mensajes sincronizados
   - Imágenes privadas
   - Notas de voz efímeras
3. Si todo funciona, puedes distribuir el APK

## Distribución

### Opción 1: Compartir APK directamente
- Sube el APK a Google Drive, Dropbox, etc.
- Comparte el link
- Los usuarios deben habilitar "Instalar apps de fuentes desconocidas"

### Opción 2: Google Play Store (futuro)
- Necesitarás generar un AAB en lugar de APK
- Cambiar `buildType` a `"aab"` en `eas.json`
- Seguir el proceso de publicación de Google Play

## Comando Rápido

Para generar el APK de prueba rápidamente:

```bash
eas build -p android --profile preview --non-interactive
```

¡Listo para generar tu APK! 🚀
