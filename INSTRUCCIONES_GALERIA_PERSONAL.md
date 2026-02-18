# Instrucciones: Galería Personal

## Descripción
Sistema de galería personal donde los usuarios pueden subir fotos y controlar su visibilidad. Las fotos pueden ser:
- **VISIBLE**: La pareja puede verlas
- **SOLO YO**: Solo el dueño puede verlas

## Características
- ✅ Dos pestañas: "Mis Fotos" y "Fotos de [Pareja]"
- ✅ Subir fotos desde galería o cámara
- ✅ Control de visibilidad por foto (corazón rosa = visible, candado = privado)
- ✅ Añadir descripción opcional a las fotos
- ✅ Eliminar fotos propias
- ✅ Grid de 2 columnas con thumbnails
- ✅ Compresión automática de imágenes
- ✅ Banner informativo sobre fotos privadas

## Pasos para aplicar

### 1. Crear tabla en Supabase
Ejecuta el archivo `supabase/APLICAR_GALERIA_PERSONAL.sql` en el SQL Editor de Supabase.

### 2. Crear bucket de storage
Ejecuta el archivo `supabase/CREAR_BUCKET_GALERIA.sql` en el SQL Editor de Supabase.

### 3. Verificar permisos
Asegúrate de que el bucket `personal-gallery` esté configurado como público en:
Storage > personal-gallery > Settings > Public bucket: ON

### 4. Instalar dependencias (si no están instaladas)
```bash
npm install expo-image-manipulator
```

### 5. Probar la funcionalidad
1. Abre la app y ve a la pestaña "Galería"
2. Verás dos pestañas: "Mis Fotos" y "Fotos de [Nombre de tu pareja]"
3. Presiona "Subir Nueva Foto"
4. Selecciona una imagen
5. Elige la visibilidad (Visible o Solo yo)
6. Sube la foto
7. Toca el corazón/candado para cambiar la visibilidad
8. Tu pareja solo verá las fotos marcadas como "VISIBLE"

## Estructura de archivos creados

```
supabase/
├── migrations/
│   └── 016_personal_gallery.sql
├── APLICAR_GALERIA_PERSONAL.sql
└── CREAR_BUCKET_GALERIA.sql

src/
├── core/
│   ├── types/
│   │   └── gallery.ts
│   └── services/
│       └── galleryService.ts
└── features/
    └── gallery/
        └── PersonalGalleryScreen.tsx

app/(app)/
└── private-images.tsx (actualizado)
```

## Esquema de colores
- Rosa principal: #FF6B9D
- Rosa claro: #FFE4EC
- Gris: #666
- Blanco: #FFF

## Notas importantes
- Las fotos se comprimen automáticamente a 1920px de ancho
- Se generan thumbnails de 400px para el grid
- Máximo 500 caracteres para la descripción
- Las políticas RLS aseguran que solo la pareja conectada pueda ver fotos visibles
- El bucket debe ser público para que las URLs funcionen correctamente
