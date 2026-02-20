# 📝 Changelog

Registro de cambios importantes del proyecto Palpitos.

## [2026-02-20] - Mejora de UX en Mensajes Citados

### 🎨 Mejorado
- **Resaltado de mensajes citados:** Ahora cuando haces click en un mensaje citado:
  - Se hace scroll automático al mensaje original
  - El mensaje se resalta con un borde azul brillante (#667eea)
  - Efecto de escala sutil (1.02x) para mejor visibilidad
  - Sombra más pronunciada durante el resaltado
  - Feedback háptico medio para confirmar la acción
  - Duración del resaltado aumentada a 3 segundos
  - Mejor manejo de errores con alertas informativas

## [2026-02-20] - Corrección de Mensajería y Limpieza

### ✅ Agregado
- Sistema de mensajes en tiempo real con Supabase Realtime
- Contador de caracteres visual (X/500) en inputs de mensajes
- Archivo `supabase/schema.sql` con el schema actualizado de la base de datos
- Archivo `docs/README.md` para organizar la documentación
- Archivo `docs/MENSAJES_TIEMPO_REAL_FIX.md` documentando las correcciones

### 🔧 Corregido
- **Mensajes con retraso:** Implementada suscripción en tiempo real (antes polling cada 5s)
- **Límite de caracteres inconsistente:** 
  - Base de datos: 50 → 500 caracteres
  - Frontend messages.tsx: 200 → 500 caracteres
  - Frontend home.tsx: 50 → 500 caracteres
- **Rate limiting sin feedback:** Agregados mensajes de error claros al usuario
- **Notificaciones sin manejo de errores:** Validación de tokens y mejor manejo de errores
- **Constraint duplicado:** Eliminados constraints conflictivos en sync_messages

### 🗑️ Eliminado
- `google-services.json` (duplicado en raíz)
- `google-services (3).json` (duplicado)
- `supabase/fix_message_constraint.sql` (temporal, ya aplicado)
- `supabase/check_constraints.sql` (temporal, ya aplicado)
- `supabase/fix_duplicate_constraint.sql` (temporal, ya aplicado)
- `docs/SEGURIDAD_IMPLEMENTACION_RAPIDA.md` (redundante con PASOS_IMPLEMENTACION.md)

### 📊 Mejoras de Rendimiento
- Polling reducido de 5s a 30s (con tiempo real como principal)
- Índices optimizados en base de datos:
  - `idx_sync_messages_couple_created`
  - `idx_sync_messages_unread`
  - `idx_sync_messages_reply`
- Rate limiting aumentado de 10 a 20 mensajes/minuto

### 🔒 Seguridad
- Validación de tokens de notificación antes de enviar
- Prioridad "high" para notificaciones de mensajes
- Mejor manejo de errores en toda la cadena de mensajería

---

## Versiones Anteriores

### [2026-02-XX] - Implementación de Seguridad
- Rate limiting en base de datos
- Validación de datos
- Sanitización de inputs
- Ofuscación de código

### [2026-01-XX] - Sistema de Anuncios
- Integración de AdMob
- Anuncios nativos
- Sistema de fallback inteligente
- Recompensas por anuncios

### [2025-12-XX] - Features Principales
- Sistema de mensajería sincronizada
- Estados emocionales
- Galería privada
- Notas de voz
- Calendario de eventos

---

## 📋 Formato de Changelog

Seguimos el formato [Keep a Changelog](https://keepachangelog.com/):

- **Agregado** - Nuevas funcionalidades
- **Cambiado** - Cambios en funcionalidades existentes
- **Obsoleto** - Funcionalidades que serán removidas
- **Eliminado** - Funcionalidades removidas
- **Corregido** - Corrección de bugs
- **Seguridad** - Mejoras de seguridad
