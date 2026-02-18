# 🎨 Sistema de Personalización de Temas - Instrucciones

## ✅ Archivos Creados

1. `src/core/types/theme.ts` - Tipos TypeScript para temas
2. `src/core/config/themes.ts` - 10 temas predefinidos
3. `src/core/store/useThemeStore.ts` - Store de Zustand para gestionar temas
4. `src/shared/hooks/useTheme.ts` - Hooks para usar temas fácilmente
5. `app/(app)/theme-settings.tsx` - Pantalla de personalización

---

## 🎨 Temas Disponibles

### Gratuitos (3)
1. **💕 Palpitos Original** - Rosa/Morado (default)
2. **🌅 Atardecer** - Naranja/Rosa
3. **🌊 Océano** - Azul/Turquesa

### Premium (7)
4. **🌲 Bosque** - Verde/Esmeralda
5. **💜 Lavanda** - Lavanda/Púrpura
6. **🍒 Cereza** - Rojo/Rosa
7. **🌙 Medianoche** - Azul oscuro/Negro
8. **🍑 Durazno** - Durazno/Coral
9. **🍃 Menta** - Menta/Verde claro
10. **👑 Real** - Azul real/Dorado

---

## 🚀 Cómo Usar en Componentes

### Opción 1: Hook useTheme (Recomendado)

```typescript
import { useTheme } from '@/shared/hooks/useTheme';

export default function MyComponent() {
    const { colors, theme } = useTheme();

    return (
        <View style={{ backgroundColor: colors.background }}>
            <Text style={{ color: colors.text }}>Hola</Text>
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.gradient}
            />
        </View>
    );
}
```

### Opción 2: Hook useThemeColors (Solo colores)

```typescript
import { useThemeColors } from '@/shared/hooks/useTheme';

export default function MyComponent() {
    const colors = useThemeColors();

    return (
        <Text style={{ color: colors.primary }}>
            Texto con color primario
        </Text>
    );
}
```

### Opción 3: Store directo

```typescript
import { useThemeStore } from '@/core/store/useThemeStore';

export default function MyComponent() {
    const { theme, setTheme } = useThemeStore();

    return (
        <Pressable onPress={() => setTheme('ocean')}>
            <Text>Cambiar a tema Océano</Text>
        </Pressable>
    );
}
```

---

## 📝 Colores Disponibles

Cada tema tiene estos colores:

```typescript
interface ThemeColors {
  // Colores principales
  primary: string;          // Color principal de la app
  secondary: string;        // Color secundario
  accent: string;           // Color de acento
  
  // Gradientes
  gradientStart: string;    // Inicio del gradiente
  gradientEnd: string;      // Fin del gradiente
  
  // Backgrounds
  background: string;       // Fondo general
  cardBackground: string;   // Fondo de tarjetas
  
  // Textos
  text: string;             // Texto principal
  textSecondary: string;    // Texto secundario
  textLight: string;        // Texto claro
  
  // Estados
  success: string;          // Verde (éxito)
  warning: string;          // Amarillo (advertencia)
  error: string;            // Rojo (error)
  info: string;             // Azul (información)
  
  // Específicos de la app
  heartColor: string;       // Color del corazón
  syncColor: string;        // Color de sincronización
}
```

---

## 🔧 Aplicar Temas en Pantallas Existentes

### Ejemplo: Actualizar home.tsx

**ANTES:**
```typescript
<LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
    <Text style={{ color: '#181113' }}>Hola</Text>
</LinearGradient>
```

**DESPUÉS:**
```typescript
import { useTheme } from '@/shared/hooks/useTheme';

export default function HomeScreen() {
    const { colors } = useTheme();

    return (
        <LinearGradient 
            colors={[colors.gradientStart, colors.gradientEnd]} 
            style={styles.container}
        >
            <Text style={{ color: colors.text }}>Hola</Text>
        </LinearGradient>
    );
}
```

### Ejemplo: Actualizar register.tsx

**ANTES:**
```typescript
<LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
```

**DESPUÉS:**
```typescript
import { useTheme } from '@/shared/hooks/useTheme';

export default function RegisterScreen() {
    const { colors } = useTheme();

    return (
        <LinearGradient 
            colors={[colors.gradientStart, colors.gradientEnd]} 
            style={styles.container}
        >
```

---

## 🎯 Inicializar el Sistema de Temas

### 1. En el _layout.tsx principal

```typescript
import { useThemeStore } from '@/core/store/useThemeStore';
import { useEffect } from 'react';

export default function RootLayout() {
    const { loadTheme } = useThemeStore();

    useEffect(() => {
        // Cargar tema guardado al iniciar la app
        loadTheme();
    }, []);

    return (
        // ... resto del layout
    );
}
```

### 2. Agregar botón en el menú de perfil

En `home.tsx` o donde tengas el menú:

```typescript
<Pressable
    style={styles.menuItem}
    onPress={() => router.push('/(app)/theme-settings')}
>
    <Ionicons name="color-palette" size={24} color="#667eea" />
    <Text style={styles.menuText}>Personalización</Text>
</Pressable>
```

---

## 🔐 Sistema Premium

### Verificar si el usuario tiene Premium

```typescript
const { isPremium, setPremiumStatus } = useThemeStore();

// Cuando el usuario compra Premium
setPremiumStatus(true);

// Cuando pierde Premium
setPremiumStatus(false);
```

### Bloquear temas Premium

El sistema automáticamente:
- ✅ Bloquea temas premium si el usuario no tiene suscripción
- ✅ Muestra candado en temas premium
- ✅ Muestra alerta al intentar seleccionar tema premium
- ✅ Vuelve al tema default si pierde Premium

---

## 📱 Pantalla de Personalización

### Características

1. **Grid de temas** - Muestra todos los temas en cuadrícula
2. **Vista previa** - Gradiente de cada tema
3. **Indicador de selección** - Checkmark en tema activo
4. **Candados** - Temas premium bloqueados
5. **Badges Premium** - Indica qué temas son premium
6. **Secciones** - Gratuitos y Premium separados

### Navegación

```typescript
// Desde cualquier pantalla
router.push('/(app)/theme-settings');
```

---

## 🎨 Crear Nuevos Temas

### 1. Agregar tipo en theme.ts

```typescript
export type ThemeType = 
  | 'default'
  | 'sunset'
  // ... otros
  | 'mi-nuevo-tema';  // ⬅️ AGREGAR AQUÍ
```

### 2. Agregar configuración en themes.ts

```typescript
export const THEMES: Record<ThemeType, Theme> = {
  // ... otros temas
  
  'mi-nuevo-tema': {
    id: 'mi-nuevo-tema',
    name: 'Mi Nuevo Tema',
    emoji: '🎨',
    isPremium: false,  // o true
    colors: {
      primary: '#FF0000',
      secondary: '#00FF00',
      accent: '#0000FF',
      gradientStart: '#FF0000',
      gradientEnd: '#00FF00',
      background: '#FFFFFF',
      cardBackground: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      textLight: '#9CA3AF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      heartColor: '#FF0000',
      syncColor: '#00FF00',
    },
  },
};
```

### 3. Agregar a lista de temas

```typescript
// Si es gratuito
export const FREE_THEMES: ThemeType[] = [
  'default', 
  'sunset', 
  'ocean',
  'mi-nuevo-tema',  // ⬅️ AGREGAR AQUÍ
];

// Si es premium
export const PREMIUM_THEMES: ThemeType[] = [
  'forest',
  // ... otros
  'mi-nuevo-tema',  // ⬅️ O AQUÍ
];
```

---

## 🔄 Migración de Pantallas Existentes

### Checklist para cada pantalla:

1. ✅ Importar `useTheme` o `useThemeColors`
2. ✅ Reemplazar colores hardcodeados con `colors.xxx`
3. ✅ Reemplazar gradientes con `[colors.gradientStart, colors.gradientEnd]`
4. ✅ Actualizar estilos dinámicos
5. ✅ Probar con diferentes temas

### Pantallas a actualizar:

- [ ] `app/(auth)/login.tsx`
- [ ] `app/(auth)/register.tsx`
- [ ] `app/(auth)/reset-password.tsx`
- [ ] `app/(auth)/verify-otp.tsx`
- [ ] `app/(auth)/verify-email.tsx`
- [ ] `app/(app)/home.tsx`
- [ ] `app/(app)/partner-profile.tsx`
- [ ] Otros componentes con colores hardcodeados

---

## 💾 Persistencia

El tema seleccionado se guarda automáticamente en AsyncStorage:
- ✅ Se carga al iniciar la app
- ✅ Persiste entre sesiones
- ✅ Se sincroniza con el estado de Premium

---

## 🧪 Testing

### Probar cambio de tema

```typescript
import { useThemeStore } from '@/core/store/useThemeStore';

// En cualquier componente
const { setTheme } = useThemeStore();

// Cambiar tema
await setTheme('ocean');
await setTheme('lavender');
await setTheme('default');
```

### Probar Premium

```typescript
const { setPremiumStatus } = useThemeStore();

// Activar Premium
setPremiumStatus(true);

// Desactivar Premium
setPremiumStatus(false);
```

---

## 📊 Ejemplo Completo

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/shared/hooks/useTheme';
import { useRouter } from 'expo-router';

export default function MyScreen() {
    const { colors, theme } = useTheme();
    const router = useRouter();

    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.container}
        >
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {theme.name}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Tema actual: {theme.emoji}
                </Text>
                
                <Pressable
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/(app)/theme-settings')}
                >
                    <Text style={styles.buttonText}>
                        Cambiar Tema
                    </Text>
                </Pressable>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        padding: 24,
        borderRadius: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
```

---

## 🎉 ¡Listo!

El sistema de temas está completamente funcional. Solo falta:

1. Inicializar en `_layout.tsx`
2. Agregar botón de "Personalización" en el menú
3. Migrar pantallas existentes para usar `useTheme()`

**¡Disfruta personalizando tu app!** 🎨
