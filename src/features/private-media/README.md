# 📸 Sistema de Imágenes Privadas

Sistema para enviar y recibir imágenes privadas con funcionalidad "ver una vez" como WhatsApp.

## 🚀 Configuración Inicial

### 1. Crear Bucket en Supabase Storage

1. Ve a **Storage** en Supabase Dashboard
2. Crea bucket `private-images` (privado)
3. Aplica las políticas del archivo `supabase/APLICAR_POLITICAS_STORAGE.sql`

### 2. Usar en tu App

```typescript
import { usePrivateImages } from '@/shared/hooks/usePrivateImages';

function MyComponent() {
  const { pickAndSendImage, pendingImages } = usePrivateImages();
  
  return (
    <View>
      <Text>{pendingImages.length} imágenes pendientes</Text>
      <Button 
        title="Enviar imagen" 
        onPress={() => pickAndSendImage(partnerId, { maxViews: 1 })}
      />
    </View>
  );
}
```

## 📱 Componentes

- `<PrivateImageCard />` - Tarjeta de imagen pendiente
- `<SendPrivateImageButton />` - Botón para enviar imágenes
- `<PrivateMediaScreen />` - Pantalla completa con lista

## 🔒 Seguridad

- Capturas de pantalla bloqueadas con `expo-screen-capture`
- Imágenes se eliminan automáticamente después de verlas (si max_views = 1)
- URLs firmadas con expiración de 60 segundos
- Políticas RLS en base de datos y storage
