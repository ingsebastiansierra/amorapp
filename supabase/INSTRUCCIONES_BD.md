# 📊 Instrucciones para Crear la Base de Datos en Supabase

## Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea cuenta o inicia sesión
3. Click en **"New Project"**
4. Completa:
   - **Name**: couple-connection
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Elige la más cercana a ti
5. Click en **"Create new project"**
6. Espera 2-3 minutos mientras se crea

## Paso 2: Ejecutar Scripts SQL

### 2.1 Ejecutar Primera Migración (Tablas)

1. En tu proyecto de Supabase, ve a **SQL Editor** (icono 📊 en el menú izquierdo)
2. Click en **"New Query"**
3. Copia y pega TODO el contenido del archivo `001_initial_schema.sql`
4. Click en **"Run"** (botón ▶️ abajo a la derecha)
5. Deberías ver: "Success. No rows returned"

### 2.2 Ejecutar Segunda Migración (Políticas de Seguridad)

1. Click en **"New Query"** otra vez
2. Copia y pega TODO el contenido del archivo `002_rls_policies.sql`
3. Click en **"Run"** (▶️)
4. Deberías ver: "Success. No rows returned"

## Paso 3: Configurar Storage para Imágenes

1. Ve a **Storage** (icono 🗂️ en el menú izquierdo)
2. Click en **"Create a new bucket"**
3. Completa:
   - **Name**: `couple-images`
   - **Public bucket**: ❌ NO (déjalo desmarcado, debe ser privado)
4. Click en **"Create bucket"**

### 3.1 Configurar Políticas del Bucket

1. Click en el bucket `couple-images` que acabas de crear
2. Ve a la pestaña **"Policies"**
3. Click en **"New Policy"**
4. Selecciona **"For full customization"**
5. Crea estas 3 políticas:

**Política 1: Subir imágenes**
- Policy name: `Users can upload images to partner`
- Allowed operation: INSERT
- Target roles: authenticated
- USING expression:
```sql
(auth.uid() = (storage.foldername(name))[1]::uuid)
```

**Política 2: Ver imágenes**
- Policy name: `Users can view their couple images`
- Allowed operation: SELECT
- Target roles: authenticated
- USING expression:
```sql
(auth.uid() = (storage.foldername(name))[1]::uuid OR 
 auth.uid() = (storage.foldername(name))[2]::uuid)
```

**Política 3: Eliminar imágenes**
- Policy name: `Users can delete their own images`
- Allowed operation: DELETE
- Target roles: authenticated
- USING expression:
```sql
(auth.uid() = (storage.foldername(name))[1]::uuid)
```

## Paso 4: Obtener Credenciales

1. Ve a **Settings** (⚙️) → **API**
2. Copia estos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: La clave larga que empieza con `eyJ...`

## Paso 5: Configurar la App

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza con tus valores:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

3. Guarda el archivo
4. Reinicia el servidor de Expo (Ctrl+C y luego `npm start`)

## ✅ Verificar que Todo Funciona

1. En Supabase, ve a **Table Editor**
2. Deberías ver estas tablas:
   - users
   - couples
   - emotional_states
   - gestures
   - heart_interactions
   - challenges
   - challenge_progress
   - images_private
   - connection_metrics

3. En **Storage**, deberías ver el bucket `couple-images`

## 🎉 ¡Listo!

Ahora tu app está conectada a Supabase y lista para:
- ✅ Autenticación de usuarios
- ✅ Estados emocionales en tiempo real
- ✅ Sincronización entre parejas
- ✅ Almacenamiento de imágenes privadas
- ✅ Historial emocional
- ✅ Retos diarios

## 🐛 Problemas Comunes

**Error: "relation already exists"**
- Ya ejecutaste ese script antes, está bien, ignóralo

**Error: "permission denied"**
- Asegúrate de estar ejecutando los scripts en el SQL Editor de Supabase
- Verifica que tu proyecto esté completamente creado

**La app no conecta**
- Verifica que copiaste bien las credenciales en `.env`
- Asegúrate de reiniciar el servidor de Expo después de editar `.env`
- Las credenciales NO deben tener comillas ni espacios extras
