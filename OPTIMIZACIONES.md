# 🚀 Optimizaciones de Tamaño - Palpitos App

## Resumen de Optimizaciones

### ✅ Optimizaciones Implementadas

#### 1. Archivo `.easignore` Mejorado
- Excluye documentación innecesaria (*.md)
- Excluye scripts de desarrollo
- Excluye builds locales de Android
- Excluye archivos de prueba
- Excluye caché de node_modules

**Resultado**: Reduce el upload a EAS de ~890MB a ~200-300MB

#### 2. Configuración de Metro Optimizada
- `drop_console: true` - Elimina console.log en producción
- `drop_debugger: true` - Elimina debugger statements
- `mangle: true` - Acorta nombres de variables
- `comments: false` - Elimina comentarios del código

**Resultado**: Reduce el tamaño del bundle JS en ~15-20%

#### 3. Script de Limpieza Automática
- Limpia `.gradle` y `.cxx` de Android
- Limpia caché de Expo
- Limpia caché de node_modules
- Se ejecuta automáticamente antes de builds

**Resultado**: Libera ~3GB de espacio local

#### 4. `.gitignore` Optimizado
- Evita subir builds locales
- Evita subir caché innecesario
- Mantiene el repositorio limpio

**Resultado**: Repositorio más ligero y rápido

## Tamaños Antes y Después

| Componente | Antes | Después | Reducción |
|------------|-------|---------|-----------|
| Android folder | 3.1 GB | 2.23 MB | 99.9% |
| Upload a EAS | 890 MB | ~250 MB | 72% |
| Bundle JS | - | -15% | 15% |

## Comandos Disponibles

### Limpiar Proyecto
```bash
npm run clean
```

### Build de Producción (con limpieza automática)
```bash
npm run build:production
```

### Build AAB para Play Store
```bash
npm run build:production-aab
```

## Recomendaciones Adicionales

### 1. Optimizar Imágenes
- Usa WebP en lugar de PNG cuando sea posible
- Comprime imágenes antes de agregarlas
- Considera usar `expo-image` con caché

### 2. Code Splitting
- Usa lazy loading para pantallas no críticas
- Divide el código en chunks más pequeños

### 3. Dependencias
- Revisa periódicamente las dependencias
- Elimina paquetes no utilizados
- Usa `npm prune` regularmente

### 4. Assets
- Comprime audio antes de incluirlo
- Usa formatos optimizados (AAC para audio)
- Considera cargar assets grandes desde CDN

## Monitoreo de Tamaño

### Ver tamaño de carpetas
```bash
# Windows PowerShell
Get-ChildItem -Directory | ForEach-Object { 
  $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | 
  Measure-Object -Property Length -Sum).Sum; 
  [PSCustomObject]@{
    Folder=$_.Name; 
    "Size(MB)"=[math]::Round($size/1MB, 2)
  } 
} | Sort-Object "Size(MB)" -Descending
```

### Analizar bundle size
```bash
npx expo export --dump-sourcemap
```

## Notas Importantes

- Las optimizaciones NO afectan la funcionalidad de la app
- Los console.log solo se eliminan en builds de producción
- La limpieza automática es segura y reversible
- Los archivos excluidos en `.easignore` NO afectan el build final

## Próximos Pasos

1. ✅ Optimizaciones básicas implementadas
2. 🔄 Monitorear tamaño de builds
3. 📊 Analizar bundle con source maps
4. 🎯 Optimizar assets si es necesario
