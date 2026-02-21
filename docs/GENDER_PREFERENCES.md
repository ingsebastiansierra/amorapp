# Sistema de Preferencias de Género

## Descripción General

El sistema de preferencias de género permite a los usuarios filtrar qué perfiles ven en el Discovery según su orientación y preferencias personales.

## Opciones Disponibles

Los usuarios pueden configurar su preferencia `looking_for_gender` con tres valores:

1. **'male'** - Solo ver hombres
2. **'female'** - Solo ver mujeres  
3. **'any'** - Ver ambos géneros (opción por defecto)

## Cómo Funciona

### En la Base de Datos

La tabla `user_preferences` almacena las preferencias de cada usuario:

```sql
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY,
    looking_for_gender TEXT DEFAULT 'any' CHECK (looking_for_gender IN ('male', 'female', 'any')),
    -- otros campos...
);
```

### En el Código (Discovery)

El archivo `app/(app)/home.tsx` implementa el filtrado:

```typescript
// 1. Obtener preferencias del usuario actual
const { data: myPreferences } = await supabase
    .from('user_preferences')
    .select('looking_for_gender')
    .eq('user_id', user.id)
    .maybeSingle();

// 2. Determinar qué género mostrar
const lookingFor = myPreferences?.looking_for_gender || 'any';

// 3. Construir query con filtro de género
let query = supabase
    .from('users')
    .select('*')
    .neq('id', user.id)
    .is('couple_id', null);

// 4. Aplicar filtro según preferencia
if (lookingFor === 'male') {
    query = query.eq('gender', 'male');
} else if (lookingFor === 'female') {
    query = query.eq('gender', 'female');
}
// Si es 'any', no se aplica filtro
```

## Configuración Inicial

### Script SQL para Configurar Preferencias

Ejecutar `database/setup_gender_preferences.sql` para:

1. Verificar usuarios sin preferencias
2. Crear preferencias por defecto ('any') para todos los usuarios
3. Ver estadísticas de preferencias configuradas

### Ejemplo de Uso

```sql
-- Ver preferencias de todos los usuarios
SELECT 
    u.name,
    u.gender as mi_genero,
    up.looking_for_gender as busco_genero
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id;
```

## Flujo de Usuario

1. **Registro**: Al crear cuenta, se asigna preferencia 'any' por defecto
2. **Onboarding**: En el paso 7/7, usuario configura sus preferencias iniciales
3. **Configuración**: Usuario puede cambiar sus preferencias en cualquier momento desde:
   - Perfil → Preferencias de Búsqueda
4. **Discovery**: Solo ve perfiles que coincidan con su preferencia
5. **Actualización**: Cambios se reflejan inmediatamente en Discovery

## Interfaz de Usuario

### Pantalla de Preferencias (`preferences-settings.tsx`)

La pantalla de configuración de preferencias incluye:

1. **Selector de Género** (3 opciones con emojis)
   - 👨 Hombres
   - 👩 Mujeres
   - 👥 Todos

2. **Rango de Edad** (sliders duales)
   - Edad mínima: 18-100 años
   - Edad máxima: 18-100 años

3. **Distancia Máxima** (slider)
   - Rango: 1-500 km

4. **Botón Guardar**
   - Guarda cambios con feedback visual
   - Actualiza preferencias en tiempo real

### Acceso desde Perfil

En `profile.tsx`, nueva opción en configuración:
- Icono: 🔍 (search)
- Título: "Preferencias de Búsqueda"
- Subtítulo: "Género, edad, distancia en Discovery"

## Casos de Uso

### Usuario busca solo mujeres
```sql
UPDATE user_preferences 
SET looking_for_gender = 'female' 
WHERE user_id = 'user-id-aqui';
```
Resultado: Solo verá perfiles de mujeres en Discovery

### Usuario busca solo hombres
```sql
UPDATE user_preferences 
SET looking_for_gender = 'male' 
WHERE user_id = 'user-id-aqui';
```
Resultado: Solo verá perfiles de hombres en Discovery

### Usuario busca ambos géneros
```sql
UPDATE user_preferences 
SET looking_for_gender = 'any' 
WHERE user_id = 'user-id-aqui';
```
Resultado: Verá perfiles de hombres y mujeres en Discovery

## Políticas RLS

Las políticas de Row Level Security aseguran que:

- Usuarios solo pueden ver sus propias preferencias
- Usuarios solo pueden modificar sus propias preferencias
- No se pueden ver las preferencias de otros usuarios

```sql
-- Política de lectura
CREATE POLICY "Users can view their own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Política de actualización
CREATE POLICY "Users can update their own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);
```

## Verificación

Para verificar que el sistema funciona correctamente:

1. Ejecutar `database/verify_users_gender.sql` para ver usuarios y géneros
2. Ejecutar `database/setup_gender_preferences.sql` para ver preferencias
3. Probar en la app cambiando preferencias y verificando Discovery

## Próximas Mejoras

- [x] Interfaz UI para cambiar preferencias en ajustes ✅
- [ ] Filtros adicionales avanzados (intereses comunes, compatibilidad)
- [ ] Estadísticas de compatibilidad basadas en preferencias
- [ ] Notificaciones cuando hay nuevos usuarios que coinciden con preferencias
- [ ] Historial de cambios de preferencias
- [ ] Sugerencias inteligentes de preferencias basadas en actividad
