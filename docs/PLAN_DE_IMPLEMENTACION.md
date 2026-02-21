# Plan de Implementación - Sistema de Intereses y Conexiones

## 🎯 Objetivo
Integrar gradualmente el sistema de intereses y conexiones múltiples sin romper la funcionalidad actual de la app.

---

## 📋 FASE 1: Preparación de Base de Datos (30 min)
**Estado**: ⏳ Pendiente

### Paso 1.1: Ejecutar Migración de Base de Datos
**Archivo**: `database/migrations/add_interest_profile_system.sql`

**Acciones**:
1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Copiar TODO el contenido del archivo de migración
4. Ejecutar el script
5. Verificar que se crearon las 10 tablas nuevas

**Verificación**:
```sql
-- Ejecutar esta query para verificar
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_intentions',
  'user_interests',
  'user_preferences',
  'connections',
  'matches',
  'messages',
  'swipes',
  'reports',
  'blocks',
  'compatibility_cache'
);
```

**Resultado esperado**: Debe mostrar 10 tablas

---

## 📋 FASE 2: Pantalla de Perfil con Cuestionarios (1 hora)
**Estado**: ⏳ Pendiente

### Paso 2.1: Modificar Home para Mostrar Progreso de Perfil

**Objetivo**: Agregar una sección en el home que muestre el progreso del perfil del usuario.

**Cambios en**: `app/(app)/home.tsx`

**Qué agregar**:
- Card de "Completa tu Perfil" con porcentaje de completitud
- Lista de cuestionarios pendientes
- Botón para ir a completar cada sección

**Diseño propuesto**:
```
┌─────────────────────────────┐
│ 📝 Completa tu Perfil       │
│                             │
│ ████████░░░░░░░░ 60%        │
│                             │
│ ✅ Intenciones              │
│ ✅ Música                   │
│ ⏳ Deportes (Pendiente)     │
│ ⏳ Comida (Pendiente)       │
│ ⏳ Estilo de vida           │
│                             │
│ [Completar Ahora]           │
└─────────────────────────────┘
```

**Archivos a crear**:
- `src/shared/components/ProfileProgressCard.tsx` - Componente reutilizable

---

## 📋 FASE 3: Integrar Onboarding Opcional (30 min)
**Estado**: ⏳ Pendiente

### Paso 3.1: Agregar Botón en Perfil

**Objetivo**: Permitir que usuarios completen el onboarding desde su perfil.

**Cambios en**: `app/(app)/profile.tsx`

**Qué agregar**:
- Sección "Mis Intereses"
- Botón "Completar Cuestionario"
- Indicador de progreso

### Paso 3.2: Hacer Onboarding Opcional

**Cambios en**: `app/(auth)/verify-email.tsx`

**Opciones**:
1. Mostrar modal: "¿Quieres completar tu perfil ahora?"
2. Botón "Ahora" → Onboarding
3. Botón "Después" → Home

---

## 📋 FASE 4: Pantalla de Descubrimiento Simple (2 horas)
**Estado**: ⏳ Pendiente

### Paso 4.1: Crear Pantalla de Personas Cercanas

**Archivo nuevo**: `app/(app)/discover.tsx`

**Funcionalidad**:
- Lista simple de usuarios (NO swipe todavía)
- Mostrar foto, nombre, edad
- Mostrar % de compatibilidad
- Botón "Ver Perfil"

**Diseño propuesto**:
```
┌─────────────────────────────┐
│ 🔍 Personas Cerca           │
├─────────────────────────────┤
│ ┌─────┐                     │
│ │ 👤  │ María, 25           │
│ └─────┘ 85% compatible      │
│         "Me gusta el rock"  │
│         [Ver Perfil]        │
├─────────────────────────────┤
│ ┌─────┐                     │
│ │ 👤  │ Juan, 28            │
│ └─────┘ 72% compatible      │
│         "Amante del fútbol" │
│         [Ver Perfil]        │
└─────────────────────────────┘
```

### Paso 4.2: Agregar Tab de Descubrir

**Cambios en**: `app/(app)/_layout.tsx`

**Agregar**:
- Nuevo tab "Descubrir" (opcional, oculto por defecto)
- Solo visible si el usuario completó su perfil

---

## 📋 FASE 5: Sistema de Conexiones Básico (1.5 horas)
**Estado**: ⏳ Pendiente

### Paso 5.1: Agregar Botón "Conectar" en Perfiles

**Funcionalidad**:
- Ver perfil de otra persona
- Botón "Enviar Solicitud de Conexión"
- Notificación a la otra persona

### Paso 5.2: Pantalla de Solicitudes

**Archivo nuevo**: `app/(app)/connection-requests.tsx`

**Mostrar**:
- Solicitudes recibidas
- Solicitudes enviadas
- Botones: Aceptar / Rechazar

### Paso 5.3: Lista de Conexiones

**Modificar**: `app/(app)/messages.tsx`

**Agregar**:
- Sección "Mis Conexiones"
- Lista de personas conectadas
- Tap para abrir chat

---

## 📋 FASE 6: Chat Multi-Usuario (1 hora)
**Estado**: ⏳ Pendiente

### Paso 6.1: Adaptar Chat Existente

**Cambios en**: `app/(app)/messages.tsx`

**Modificar**:
- Soportar múltiples conversaciones
- Usar tabla `messages` en lugar de `sync_messages`
- Mantener UI actual

### Paso 6.2: Selector de Conversación

**Agregar**:
- Lista de chats activos
- Indicador de mensajes no leídos
- Última actividad

---

## 📋 FASE 7: Algoritmo de Compatibilidad (30 min)
**Estado**: ⏳ Pendiente

### Paso 7.1: Activar Cálculo de Compatibilidad

**Usar**: `src/core/services/matchingService.ts`

**Integrar**:
- Calcular compatibilidad al ver perfiles
- Mostrar porcentaje en lista
- Ordenar por compatibilidad

---

## 📋 FASE 8: Funciones Avanzadas (Opcional)
**Estado**: ⏳ Pendiente

### Paso 8.1: Swipe Interface (Opcional)
- Agregar gestos de swipe
- Animaciones
- Match instantáneo

### Paso 8.2: Filtros de Búsqueda
- Por edad
- Por distancia
- Por intereses

### Paso 8.3: Notificaciones Push
- Nueva conexión
- Nuevo mensaje
- Match

---

## 🎯 Resumen de Prioridades

### ✅ DEBE HACERSE (Core)
1. ✅ Migración de base de datos
2. ⏳ Card de progreso en home
3. ⏳ Completar perfil desde settings
4. ⏳ Lista simple de personas
5. ⏳ Sistema de conexiones básico

### 🔄 DEBERÍA HACERSE (Importante)
6. ⏳ Chat multi-usuario
7. ⏳ Algoritmo de compatibilidad
8. ⏳ Notificaciones

### 💡 PODRÍA HACERSE (Nice to have)
9. ⏳ Swipe interface
10. ⏳ Filtros avanzados
11. ⏳ Estadísticas de perfil

---

## 📊 Estimación de Tiempo

| Fase | Tiempo | Dificultad |
|------|--------|------------|
| Fase 1 | 30 min | Fácil |
| Fase 2 | 1 hora | Media |
| Fase 3 | 30 min | Fácil |
| Fase 4 | 2 horas | Media |
| Fase 5 | 1.5 horas | Media |
| Fase 6 | 1 hora | Media |
| Fase 7 | 30 min | Fácil |
| **TOTAL** | **7 horas** | - |

---

## 🚨 Reglas Importantes

1. **NO ROMPER LO QUE FUNCIONA**
   - Mantener sistema de emociones actual
   - Mantener chat de pareja existente
   - Todo nuevo es ADICIONAL, no reemplazo

2. **TESTING DESPUÉS DE CADA FASE**
   - Probar funcionalidad nueva
   - Verificar que lo viejo sigue funcionando
   - Hacer commit después de cada fase

3. **ROLLBACK FÁCIL**
   - Cada fase es independiente
   - Se puede desactivar sin afectar otras

4. **FEEDBACK DEL USUARIO**
   - Mostrar al usuario después de Fase 2
   - Ajustar según feedback
   - No continuar si hay problemas

---

## 📝 Checklist de Cada Fase

Antes de pasar a la siguiente fase:

- [ ] Código implementado
- [ ] Sin errores en consola
- [ ] Funcionalidad probada manualmente
- [ ] Funcionalidad antigua sigue funcionando
- [ ] Commit realizado
- [ ] Documentación actualizada

---

## 🎬 ¿Por Dónde Empezar?

**RECOMENDACIÓN**: Empezar con **FASE 1** (Base de datos)

**Siguiente paso inmediato**:
1. Ejecutar migración de base de datos
2. Verificar que se crearon las tablas
3. Confirmar que todo sigue funcionando
4. Pasar a FASE 2

---

## 💬 Preguntas Frecuentes

**P: ¿Puedo saltarme fases?**
R: No recomendado. Cada fase depende de la anterior.

**P: ¿Cuánto tiempo total tomará?**
R: Aproximadamente 7 horas de desarrollo + testing.

**P: ¿Qué pasa si algo sale mal?**
R: Cada fase tiene rollback. Puedes volver atrás fácilmente.

**P: ¿Necesito hacer todas las fases?**
R: No. Las fases 1-5 son core. Las demás son opcionales.

---

## 📞 Soporte

Si tienes dudas en cualquier fase:
1. Revisa la documentación en `/docs`
2. Verifica los logs de consola
3. Revisa el código de ejemplo en cada fase
4. Pregunta antes de continuar

---

**¡Listo para empezar! 🚀**

Confirma cuando hayas completado la FASE 1 para continuar con la FASE 2.
