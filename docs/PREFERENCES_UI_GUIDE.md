# Guía de Interfaz de Preferencias

## Descripción General

Sistema completo de configuración de preferencias de búsqueda con interfaz visual intuitiva.

## Ubicación en la App

```
Perfil → Preferencias de Búsqueda
```

## Pantalla: Preferencias de Búsqueda

### Archivo
`app/(app)/preferences-settings.tsx`

### Secciones

#### 1. Header
- Botón de retroceso (izquierda)
- Título: "PREFERENCIAS"
- Espaciado simétrico

#### 2. Introducción
- Icono de búsqueda (🔍)
- Título: "Preferencias de Búsqueda"
- Subtítulo: "Personaliza quién aparece en tu Discovery"

#### 3. Selector de Género
**Título de sección:** "QUIERO CONOCER"

Tres tarjetas horizontales:
- **👨 Hombres** (`male`)
- **👩 Mujeres** (`female`)
- **👥 Todos** (`any`)

**Comportamiento:**
- Selección única (radio button)
- Feedback háptico al tocar
- Tarjeta seleccionada: borde de color primario + checkmark
- Tarjeta no seleccionada: borde gris

#### 4. Rango de Edad
**Título de sección:** "RANGO DE EDAD"

**Componentes:**
- Display central: "18 años - 35 años"
- Slider 1: Edad mínima (18-100)
- Slider 2: Edad máxima (18-100)

**Validación:**
- Edad mínima < Edad máxima
- Rango: 18-100 años

#### 5. Distancia Máxima
**Título de sección:** "DISTANCIA MÁXIMA"

**Componentes:**
- Icono de ubicación + valor: "50 km"
- Slider: 1-500 km
- Labels: "1 km" (izquierda) - "500 km" (derecha)

#### 6. Información
Caja informativa:
- Icono: ℹ️
- Texto: "Los cambios se aplicarán inmediatamente en tu Discovery"

#### 7. Footer (Fijo)
Botón de guardar:
- Texto: "Guardar Cambios"
- Icono: ✓ (checkmark-circle)
- Estado loading: spinner
- Posición: fija en la parte inferior

## Flujo de Interacción

### Carga Inicial
1. Mostrar loading spinner
2. Cargar preferencias actuales desde BD
3. Poblar controles con valores existentes
4. Ocultar loading

### Modificación
1. Usuario cambia cualquier preferencia
2. Feedback háptico inmediato
3. Actualización visual instantánea
4. Sin guardado automático

### Guardado
1. Usuario presiona "Guardar Cambios"
2. Botón muestra loading
3. Upsert en `user_preferences`
4. Feedback háptico de éxito
5. Alert de confirmación
6. Retorno a pantalla anterior

## Integración con Perfil

### Ubicación
`app/(app)/profile.tsx`

### Nueva Opción de Configuración

```typescript
<Pressable onPress={() => router.push('/(app)/preferences-settings')}>
    <Icon: search />
    <Title: "Preferencias de Búsqueda" />
    <Subtitle: "Género, edad, distancia en Discovery" />
    <Chevron: forward />
</Pressable>
```

**Posición:** Primera opción en la sección "CONFIGURACIÓN"

## Estilos y Diseño

### Colores
- Fondo: `#F8F6F6` (gris claro)
- Tarjetas: `#FFF` (blanco)
- Texto principal: `#181113` (negro)
- Texto secundario: `#6B7280` (gris)
- Primario: Dinámico según tema (`colors.primary`)

### Espaciado
- Padding horizontal: 24px
- Padding vertical entre secciones: 32px
- Gap entre tarjetas: 12px
- Border radius: 16px

### Tipografía
- Título principal: 28px, bold
- Subtítulo: 16px, regular
- Títulos de sección: 11px, bold, uppercase, letter-spacing 1.5
- Labels: 14px, medium
- Valores: 24-28px, bold

### Sombras
- Tarjetas: shadowOpacity 0.05, shadowRadius 8
- Botón guardar: shadowOpacity 0.1, shadowRadius 8

## Validaciones

### Cliente (UI)
- Edad mínima < Edad máxima
- Rango de edad: 18-100
- Distancia: 1-500 km
- Género: uno de ['male', 'female', 'any']

### Servidor (BD)
```sql
CHECK (looking_for_gender IN ('male', 'female', 'any'))
CHECK (age_range_min >= 18 AND age_range_min <= 100)
CHECK (age_range_max >= 18 AND age_range_max <= 100)
CHECK (age_range_max >= age_range_min)
CHECK (distance_max_km >= 1 AND distance_max_km <= 500)
```

## Manejo de Errores

### Error al Cargar
- Mostrar Alert: "No se pudieron cargar las preferencias"
- Mantener valores por defecto
- Permitir continuar

### Error al Guardar
- Mostrar Alert: "No se pudieron guardar las preferencias"
- Mantener cambios en UI
- Permitir reintentar

### Usuario no encontrado
- Mostrar Alert: "No se encontró el usuario"
- Retornar a pantalla anterior

## Accesibilidad

- Feedback háptico en todas las interacciones
- Sliders con valores visibles
- Contraste adecuado en textos
- Áreas táctiles mínimas de 40x40px
- Loading states claros

## Testing

### Casos de Prueba

1. **Carga inicial**
   - ✓ Cargar preferencias existentes
   - ✓ Mostrar valores por defecto si no existen

2. **Selección de género**
   - ✓ Cambiar entre las 3 opciones
   - ✓ Visual feedback correcto
   - ✓ Solo una opción seleccionada

3. **Rango de edad**
   - ✓ Mover slider mínimo
   - ✓ Mover slider máximo
   - ✓ Validar mínimo < máximo

4. **Distancia**
   - ✓ Mover slider de distancia
   - ✓ Valores entre 1-500

5. **Guardado**
   - ✓ Guardar cambios exitosamente
   - ✓ Mostrar confirmación
   - ✓ Retornar a perfil

6. **Errores**
   - ✓ Manejar error de carga
   - ✓ Manejar error de guardado

## Impacto en Discovery

Los cambios guardados afectan inmediatamente:
- Filtrado de usuarios en `home.tsx`
- Query a base de datos con nuevos criterios
- Usuarios mostrados en burbujas

## Archivos Relacionados

- `app/(app)/preferences-settings.tsx` - Pantalla de preferencias
- `app/(app)/profile.tsx` - Acceso desde perfil
- `app/(app)/home.tsx` - Aplicación de filtros
- `app/(onboarding)/preferences.tsx` - Configuración inicial
- `docs/GENDER_PREFERENCES.md` - Documentación técnica
