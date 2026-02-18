# Aplicar Tema en Home Screen

## 1. Agregar import del hook useTheme

En la línea 21 (después de los otros imports), agregar:

```typescript
import { useTheme } from '@/shared/hooks/useTheme';
```

## 2. Obtener colores del tema en el componente

Después de la línea 33 (después de `const router = useRouter();`), agregar:

```typescript
const { colors } = useTheme();
```

## 3. Aplicar colores en los elementos

Buscar y reemplazar estos estilos inline:

### Badge de notificaciones (línea ~1187):
```typescript
// ANTES:
<View style={styles.badge}>

// DESPUÉS:
<View style={[styles.badge, { backgroundColor: colors.primary }]}>
```

### Botón de cambiar estado (buscar "changeMoodBtn"):
```typescript
// ANTES:
<Pressable style={styles.changeMoodBtn}

// DESPUÉS:
<Pressable style={[styles.changeMoodBtn, { backgroundColor: colors.primary }]}
```

### Botón de sync (buscar "syncButton"):
```typescript
// ANTES:
style={[styles.syncButton, !canSync && styles.syncButtonDisabled]}

// DESPUÉS:
style={[styles.syncButton, !canSync && styles.syncButtonDisabled, canSync && { backgroundColor: colors.primary }]}
```

### Selector de estado (buscar "stateSelectorContainer"):
```typescript
// ANTES:
<View style={[styles.stateSelectorContainer, { backgroundColor: '#EB477E' }]}>

// DESPUÉS:
<View style={[styles.stateSelectorContainer, { backgroundColor: colors.primary }]}>
```

### Botón de enviar mensaje (buscar "messageModalButton"):
```typescript
// ANTES:
<Pressable style={styles.messageModalButton}

// DESPUÉS:
<Pressable style={[styles.messageModalButton, { backgroundColor: colors.gradientStart }]}
```

### Botón de enviar sync (buscar "syncSendButton"):
```typescript
// ANTES:
<Pressable style={styles.syncSendButton}

// DESPUÉS:
<Pressable style={[styles.syncSendButton, { backgroundColor: colors.gradientStart }]}
```

## 4. Actualizar estilos (quitar backgroundColor hardcodeado)

En la sección de styles al final del archivo, buscar y actualizar:

```typescript
// QUITAR backgroundColor de estos estilos:
badge: {
    // QUITAR: backgroundColor: '#EB477E',
},
changeMoodBtn: {
    // QUITAR: backgroundColor: '#EB477E',
},
syncButton: {
    // QUITAR: backgroundColor: '#EB477E',
},
messageModalButton: {
    // QUITAR: backgroundColor: '#667eea',
},
syncSendButton: {
    // QUITAR: backgroundColor: '#667eea',
},
```

## Resultado

Después de estos cambios, todos los botones y elementos principales usarán los colores del tema seleccionado.
