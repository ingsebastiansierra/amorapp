# Aplicar Email Template Personalizado en Supabase

## Paso 1: Ir a Email Templates

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Authentication** → **Email Templates** (en el menú lateral)
3. Selecciona **"Confirm signup"**

## Paso 2: Copiar el Template

1. Abre el archivo `supabase/email-templates/confirm-signup.html`
2. Copia TODO el contenido
3. Pégalo en el editor de Supabase (reemplaza todo el contenido existente)

## Paso 3: Configurar el Subject

En el campo **Subject**, pon:
```
Confirma tu cuenta en Palpitos 💕
```

## Paso 4: Guardar

1. Haz clic en **Save** (abajo a la derecha)
2. Listo! El nuevo template está activo

## Variables Disponibles

El template usa estas variables de Supabase:
- `{{ .Token }}` - El código de verificación de 6 dígitos
- `{{ .ConfirmationURL }}` - El link de confirmación
- `{{ .Email }}` - El email del usuario (opcional, no lo usé)

## Características del Template

✅ Diseño moderno con gradiente morado (colores de Palpitos)
✅ Muestra el código de 6 dígitos en grande
✅ Incluye botón para confirmar con un clic
✅ Responsive para móviles
✅ Logo de Palpitos (💕)
✅ Mensaje claro y profesional
✅ Footer con información de la app

## Personalizar

Puedes editar el template para:
- Cambiar colores (busca `#667eea` y `#764ba2`)
- Cambiar textos
- Agregar más información
- Cambiar el emoji del logo
- Modificar el footer

## Vista Previa

Después de guardar, puedes:
1. Hacer clic en **Preview** para ver cómo se ve
2. Hacer una prueba registrando un usuario nuevo
3. Revisar el email que llega

## Otros Templates

También puedes personalizar:
- **Magic Link** - Para login sin contraseña
- **Change Email Address** - Para cambiar email
- **Reset Password** - Para recuperar contraseña (ya lo tienes configurado)

## Nota Importante

Los cambios se aplican inmediatamente. Todos los nuevos emails de confirmación usarán este template.
