# Verificar por qué no llegan los emails de Supabase

## Paso 1: Verificar que Email Confirmations esté activado

1. Ve a **Authentication** → **Settings** en Supabase Dashboard
2. Busca **"Enable email confirmations"**
3. Asegúrate que esté **ACTIVADO** (toggle ON)
4. Si estaba desactivado, actívalo y guarda

## Paso 2: Verificar límite de emails

Supabase tiene límites en el plan gratuito:
- **3 emails por hora** por usuario
- **30 emails por hora** en total

Para verificar:
1. Ve a **Authentication** → **Rate Limits**
2. Revisa si alcanzaste el límite
3. Espera 1 hora y vuelve a intentar

## Paso 3: Revisar logs de emails

1. Ve a **Logs** → **Auth Logs** en Supabase Dashboard
2. Busca eventos de tipo `user_signedup`
3. Verifica si hay errores relacionados con emails

## Paso 4: Verificar en spam

1. Revisa la carpeta de **Spam** o **Correo no deseado**
2. Busca emails de `noreply@mail.app.supabase.io`
3. Si está ahí, márcalo como "No es spam"

## Paso 5: Reenviar email de confirmación

Puedes reenviar el email manualmente:

1. Ve a **Authentication** → **Users**
2. Encuentra el usuario que se registró
3. Haz clic en los tres puntos (⋮)
4. Selecciona **"Send confirmation email"**

## Paso 6: Verificar configuración de email

1. Ve a **Project Settings** → **Auth**
2. Verifica que **"Confirm email"** esté en **"Enabled"**
3. Revisa el **"Site URL"** - debe ser válido

## Solución temporal: Confirmar manualmente

Si necesitas confirmar el usuario urgentemente:

1. Ve a **Authentication** → **Users**
2. Encuentra el usuario
3. Verifica que el campo **"Email Confirmed"** esté en `false`
4. Haz clic en el usuario
5. Cambia **"Email Confirmed"** a `true`
6. Guarda

## Solución: Deshabilitar confirmación de email

Si quieres que los usuarios entren sin confirmar email:

1. Ve a **Authentication** → **Settings**
2. **DESACTIVA** "Enable email confirmations"
3. Guarda cambios
4. Los nuevos usuarios podrán entrar sin confirmar

## Verificar con SQL

Ejecuta esto en SQL Editor para ver el estado del usuario:

```sql
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmation_sent_at,
    created_at
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';
```

Si `confirmation_sent_at` es NULL, significa que Supabase no intentó enviar el email.

## Configurar SMTP personalizado (Opcional)

Para mayor confiabilidad, puedes usar tu propio servicio de email:

1. Ve a **Project Settings** → **Auth**
2. Scroll hasta **"SMTP Settings"**
3. Configura con Gmail, SendGrid, o Mailgun
4. Esto mejora la entrega de emails

## Recomendación

Para apps móviles, te recomiendo **deshabilitar la confirmación de email** y permitir que los usuarios entren inmediatamente. Es mejor UX y evita problemas con emails.

Si necesitas verificar emails, puedes hacerlo después dentro de la app.
