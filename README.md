# Couple Connection App 💕

App móvil exclusiva para parejas enfocada en conexión emocional, micro-interacciones y rituales diarios.

## Stack Tecnológico

- **Frontend**: Expo + React Native + TypeScript
- **Animaciones**: Reanimated, Gesture Handler, Moti, Lottie
- **Backend**: Supabase (Auth, Realtime, Storage, PostgreSQL)
- **Notificaciones**: Expo Notifications
- **Estado**: Zustand

## Características Principales

✨ Estados emocionales en tiempo real
❤️ Corazones interactivos con presión
🎭 Comunicación sin texto (emocional)
📸 Imágenes íntimas y efímeras
🎯 Retos diarios de pareja
😡 Modo pelea inteligente
📊 Indicador de conexión emocional
📅 Historial emocional privado

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar en Android
npm run android
```

## Configuración de Supabase

1. Crear proyecto en Supabase
2. Ejecutar migraciones en `supabase/migrations/`
3. Configurar Storage bucket privado para imágenes
4. Copiar URL y anon key a `.env`

## Estructura del Proyecto

```
src/
├── core/           # Configuración, tipos, stores
├── features/       # Pantallas por funcionalidad
└── shared/         # Componentes reutilizables
```

## Próximos Pasos

- [ ] Implementar sistema de notificaciones contextuales
- [ ] Agregar animaciones Lottie para estados emocionales
- [ ] Crear sistema de retos diarios
- [ ] Implementar modo pelea inteligente
- [ ] Agregar indicador de conexión emocional
- [ ] Sistema de imágenes efímeras
- [ ] Historial emocional con timeline visual
