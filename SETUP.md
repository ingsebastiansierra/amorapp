# 🚀 Guía de Configuración - Couple Connection App

## Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click en "New Project"
4. Completa:
   - **Name**: couple-connection
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Elige la más cercana
5. Espera 2-3 minutos mientras se crea el proyecto

## Paso 2: Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** (⚙️) → **API**
2. Copia estos valores:
   - **Project URL** (ejemplo: https://xxxxx.supabase.co)
   - **anon public** key (la clave larga que empieza con "eyJ...")

## Paso 3: Configurar Variables de Entorno

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza con tus valores:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

## Paso 4: Ejecutar Migraciones SQL

1. En Supabase, ve a **SQL Editor** (icono de base de datos)
2. Click en **New Query**
3. Copia y pega el contenido de `supabase/migrations/001_initial_schema.sql`
4. Click en **Run** (▶️)
5. Repite con `supabase/migrations/002_rls_policies.sql`

## Paso 5: Configurar Storage (Imágenes)

1. Ve a **Storage** en Supabase
2. Click en **Create bucket**
3. Nombre: `couple-images`
4. **Public bucket**: NO (debe ser privado)
5. Click en **Create bucket**

## Paso 6: Iniciar la App

```bash
npm start
```

Luego:
- Escanea el QR con **Expo Go** (descárgalo de Play Store)
- O presiona `a` para abrir en emulador Android

## ✅ Verificar que Todo Funciona

1. La app debería abrir sin errores
2. Verás la pantalla de login
3. Puedes crear una cuenta con email/contraseña
4. Después de login, verás la pantalla principal con el corazón

## 🐛 Problemas Comunes

### Error: "Invalid API key"
- Verifica que copiaste bien las credenciales en `.env`
- Reinicia el servidor: Ctrl+C y `npm start`

### Error: "relation does not exist"
- No ejecutaste las migraciones SQL
- Ve al Paso 4 y ejecuta ambos archivos SQL

### No puedo escanear el QR
- Asegúrate que tu teléfono y PC están en la misma red WiFi
- Descarga Expo Go de Play Store
- Escanea el QR desde la app Expo Go

## 📱 Próximos Pasos

Una vez que la app funcione:
1. Crea dos cuentas (una para ti, otra para tu pareja)
2. Necesitarás vincular las cuentas (próxima funcionalidad a implementar)
3. Prueba cambiar estados emocionales
4. Prueba el botón de corazón (tap corto vs presión larga)
