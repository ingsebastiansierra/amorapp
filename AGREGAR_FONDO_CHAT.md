# Agregar Fondo de Imagen al Chat

## Cambios necesarios en `app/(app)/messages.tsx`

### 1. Agregar imports
```typescript
import { useChatBackgroundStore } from '@/core/store/useChatBackgroundStore';
import * as ImagePicker from 'expo-image-picker';
import { ImageBackground } from 'react-native';
```

### 2. Agregar estados en el componente
```typescript
const { backgroundImage, backgroundOpacity, setBackgroundImage, setBackgroundOpacity, loadBackground } = useChatBackgroundStore();
const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
```

### 3. Cargar fondo al iniciar
```typescript
useEffect(() => {
    loadBackground();
}, []);
```

### 4. Función para seleccionar imagen
```typescript
const handleSelectBackground = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
        await setBackgroundImage(result.assets[0].uri);
        setShowBackgroundMenu(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
};
```

### 5. Agregar botón en el header
En el header, agregar un botón junto al botón de búsqueda:

```typescript
<Pressable
    style={styles.headerButton}
    onPress={() => setShowBackgroundMenu(true)}
>
    <Ionicons name="image-outline" size={24} color="#FFF" />
</Pressable>
```

### 6. Envolver el contenido con ImageBackground
Reemplazar el View principal del contenido con:

```typescript
<ImageBackground
    source={backgroundImage ? { uri: backgroundImage } : undefined}
    style={styles.messagesContainer}
    imageStyle={{ opacity: backgroundOpacity }}
>
    {/* Contenido actual del chat */}
</ImageBackground>
```

### 7. Agregar Modal para configurar fondo
```typescript
<Modal
    visible={showBackgroundMenu}
    transparent
    animationType="slide"
    onRequestClose={() => setShowBackgroundMenu(false)}
>
    <View style={styles.backgroundMenuOverlay}>
        <View style={styles.backgroundMenu}>
            <Text style={styles.backgroundMenuTitle}>Fondo del Chat</Text>
            
            <Pressable
                style={styles.backgroundMenuItem}
                onPress={handleSelectBackground}
            >
                <Ionicons name="image" size={24} color="#667eea" />
                <Text style={styles.backgroundMenuItemText}>Seleccionar imagen</Text>
            </Pressable>

            {backgroundImage && (
                <>
                    <View style={styles.opacityControl}>
                        <Text style={styles.opacityLabel}>Opacidad: {Math.round(backgroundOpacity * 100)}%</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0.1}
                            maximumValue={0.8}
                            value={backgroundOpacity}
                            onValueChange={setBackgroundOpacity}
                            minimumTrackTintColor="#667eea"
                            maximumTrackTintColor="#E5E7EB"
                        />
                    </View>

                    <Pressable
                        style={[styles.backgroundMenuItem, styles.backgroundMenuItemDanger]}
                        onPress={async () => {
                            await useChatBackgroundStore.getState().clearBackground();
                            setShowBackgroundMenu(false);
                        }}
                    >
                        <Ionicons name="trash" size={24} color="#EF4444" />
                        <Text style={[styles.backgroundMenuItemText, styles.backgroundMenuItemTextDanger]}>
                            Quitar fondo
                        </Text>
                    </Pressable>
                </>
            )}

            <Pressable
                style={styles.backgroundMenuClose}
                onPress={() => setShowBackgroundMenu(false)}
            >
                <Text style={styles.backgroundMenuCloseText}>Cerrar</Text>
            </Pressable>
        </View>
    </View>
</Modal>
```

### 8. Agregar estilos
```typescript
backgroundMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
},
backgroundMenu: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
},
backgroundMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
},
backgroundMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
},
backgroundMenuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
},
backgroundMenuItemDanger: {
    backgroundColor: '#FEF2F2',
},
backgroundMenuItemTextDanger: {
    color: '#EF4444',
},
opacityControl: {
    marginBottom: 16,
},
opacityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
},
slider: {
    width: '100%',
    height: 40,
},
backgroundMenuClose: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
},
backgroundMenuCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
},
```

## Instalación de dependencias

Si no tienes el slider, instala:
```bash
npm install @react-native-community/slider
```

O usa un control personalizado sin slider.

## Resultado

- Botón de imagen en el header del chat
- Modal para seleccionar imagen de la galería
- Control de opacidad del fondo
- Opción para quitar el fondo
- Fondo guardado en AsyncStorage (persiste entre sesiones)
