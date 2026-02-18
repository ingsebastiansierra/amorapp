# Configurar Página de Confirmación Personalizada

## Problema
Cuando el usuario hace clic en el link del email, Supabase abre una página web genérica y fea.

## Solución
Crear una página HTML personalizada y bonita para mostrar cuando se confirma el email.

## Opción 1: Hospedar en Vercel/Netlify (Recomendado)

### Paso 1: Crear el proyecto web
1. Crea una carpeta nueva: `palpitos-web`
2. Copia el archivo `public/email-confirmed.html` a esa carpeta
3. Renómbralo a `index.html`

### Paso 2: Subir a Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Sube la carpeta o conéctala con GitHub
4. Deploy
5. Copia la URL (ejemplo: `https://palpitos.vercel.app`)

### Paso 3: Configurar en Supabase
1. Ve a **Authentication** → **URL Configuration**
2. En **Site URL**, pon: `https://palpitos.vercel.app`
3. En **Redirect URLs**, agrega: `https://palpitos.vercel.app/**`
4. Guarda cambios

## Opción 2: Usar Supabase Storage

### Paso 1: Subir el archivo
1. Ve a **Storage** en Supabase Dashboard
2. Crea un bucket público llamado `web`
3. Sube el archivo `email-confirmed.html`
4. Copia la URL pública

### Paso 2: Configurar redirect
1. Ve a **Authentication** → **URL Configuration**
2. En **Site URL**, pon la URL del archivo HTML
3. Guarda cambios

## Opción 3: Sin página web (Solo app móvil)

Si no quieres una página web, puedes configurar un deep link para que abra directamente la app:

### Paso 1: Configurar Deep Link
En `app.json`:
```json
{
  "expo": {
    "scheme": "palpitos",
    "ios": {
      "associatedDomains": ["applinks:tudominio.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "palpitos"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Paso 2: Configurar en Supabase
1. Ve a **Authentication** → **URL Configuration**
2. En **Site URL**, pon: `palpitos://email-confirmed`
3. Guarda cambios

## Personalizar el Email Template

También puedes personalizar el email que Supabase envía:

1. Ve a **Authentication** → **Email Templates**
2. Selecciona **"Confirm signup"**
3. Edita el HTML del email
4. Puedes cambiar colores, texto, y diseño

## Recomendación

Para una app móvil, te recomiendo:
1. **Opción 1** (Vercel) para tener una página web bonita
2. Configurar deep links para que después de confirmar, intente abrir la app automáticamente

La página HTML que creé ya incluye un script que intenta abrir la app después de 2 segundos.

## Personalizar la página

Puedes editar `public/email-confirmed.html` para:
- Cambiar colores
- Agregar tu logo
- Cambiar el texto
- Agregar más información
- Cambiar el deep link (línea 165)
