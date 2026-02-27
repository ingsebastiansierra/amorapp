# 🔥 Palpitos - App de Chat y Sentimientos

App de chat privado para parejas con funcionalidades de mensajería, compartir fotos y expresar sentimientos.

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm start
```

### Build de Producción
```bash
# APK para distribución directa
npm run build:production

# AAB para Google Play Store
npm run build:production-aab
```

## 📱 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run dev` | Inicia con dev client |
| `npm run android` | Ejecuta en Android |
| `npm run clean` | Limpia caché y archivos temporales |
| `npm run estimate-size` | Estima el tamaño del APK final |
| `npm run build:dev-apk` | Build de desarrollo |
| `npm run build:production` | Build de producción (APK) |
| `npm run build:production-aab` | Build para Play Store (AAB) |

## 🛠️ Stack Tecnológico

- **Framework**: React Native + Expo
- **Routing**: Expo Router
- **Backend**: Supabase
- **Notificaciones**: Expo Notifications
- **Animaciones**: React Native Reanimated
- **Estado**: Zustand

## 📦 Tamaño de la App

- **APK**: ~22 MB
- **Instalado**: ~48 MB

Ver análisis completo: `npm run estimate-size`

## 🔧 Configuración

### Variables de Entorno
Copia `.env.example` a `.env` y configura:
- Credenciales de Supabase
- Configuración de Firebase (opcional)

### Credenciales de Build
Las credenciales están gestionadas por EAS Build en la nube.

## 📄 Documentación Adicional

- [OPTIMIZACIONES.md](./OPTIMIZACIONES.md) - Optimizaciones de tamaño y rendimiento

## 👥 Equipo

Desarrollado por @sebasing04

## 📝 Licencia

Privado
