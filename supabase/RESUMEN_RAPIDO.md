# 🚀 Resumen Rápido - Configuración Supabase

## 📋 Checklist

### 1️⃣ Crear Proyecto
- [ ] Ir a https://supabase.com
- [ ] New Project → Nombre: `couple-connection`
- [ ] Guardar contraseña de BD
- [ ] Esperar 2-3 minutos

### 2️⃣ Ejecutar SQL (en SQL Editor)
- [ ] Ejecutar `001_initial_schema.sql` (crea tablas)
- [ ] Ejecutar `002_rls_policies.sql` (seguridad)
- [ ] (Opcional) Ejecutar `003_seed_data.sql` (retos de ejemplo)

### 3️⃣ Crear Storage
- [ ] Storage → Create bucket
- [ ] Nombre: `couple-images`
- [ ] Public: NO ❌
- [ ] Create bucket

### 4️⃣ Copiar Credenciales
- [ ] Settings → API
- [ ] Copiar **Project URL**
- [ ] Copiar **anon public key**

### 5️⃣ Configurar App
- [ ] Editar archivo `.env` en la raíz del proyecto
- [ ] Pegar URL y key
- [ ] Guardar
- [ ] Reiniciar servidor (Ctrl+C → `npm start`)

## 📊 Estructura de la Base de Datos

```
users                    → Usuarios de la app
couples                  → Parejas vinculadas
emotional_states         → Estados emocionales (❤️😐😔😡🥺😈🤍)
gestures                 → Gestos enviados entre parejas
heart_interactions       → Interacciones con el botón de corazón
challenges               → Retos diarios
challenge_progress       → Progreso de retos
images_private           → Imágenes efímeras privadas
connection_metrics       → Métricas de conexión emocional
```

## 🔐 Seguridad (RLS)

Todas las tablas tienen Row Level Security activado:
- ✅ Solo puedes ver tus datos
- ✅ Solo puedes ver datos de tu pareja
- ✅ No puedes acceder a datos de otras parejas
- ✅ Las imágenes son completamente privadas

## 🎯 Funcionalidades que Habilita

✅ Autenticación con email/contraseña
✅ Estados emocionales en tiempo real
✅ Sincronización automática entre parejas
✅ Gestos y corazones con presión
✅ Retos diarios personalizados
✅ Imágenes privadas y efímeras
✅ Historial emocional
✅ Métricas de conexión
✅ Sistema de streaks

## ⚡ Comandos Útiles

```bash
# Iniciar app
npm start

# Limpiar caché
npx expo start --clear

# Actualizar dependencias
npx expo install --fix

# Ver logs
npm start
```

## 📱 Probar la App

1. Escanea el QR con Expo Go
2. Crea una cuenta (email + contraseña)
3. Inicia sesión
4. ¡Explora la app!

Para probar con pareja:
- Crea 2 cuentas diferentes
- Necesitarás vincularlas (próxima funcionalidad)

## 🆘 Ayuda Rápida

**Error: "Invalid API key"**
→ Verifica `.env` y reinicia servidor

**Error: "relation does not exist"**
→ Ejecuta los scripts SQL en orden

**No conecta**
→ Revisa que URL y key estén correctos en `.env`

**Modo Demo activo**
→ Configura `.env` con tus credenciales reales
