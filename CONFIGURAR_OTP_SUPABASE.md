# Configurar OTP para Registro en Supabase

## Problema Actual
Supabase está enviando un link de confirmación en lugar de un código OTP de 6 dígitos.

## Solución: Configurar Supabase Dashboard

### Paso 1: Ir a Authentication Settings
1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Authentication** → **Settings** (en el menú lateral)

### Paso 2: Deshabilitar Email Confirmation
1. Busca la sección **Email Auth**
2. Encuentra la opción **"Enable email confirmations"**
3. **DESACTÍVALA** (toggle OFF)
4. Guarda los cambios

### Paso 3: Configurar Email Templates (Opcional)
Si quieres personalizar el email con el código OTP:
1. Ve a **Authentication** → **Email Templates**
2. Selecciona **"Confirm signup"**
3. Personaliza el template para mostrar el código

## Alternativa: Usar OTP sin confirmación de email

Si prefieres que los usuarios puedan usar la app inmediatamente sin confirmar email:

### En Supabase Dashboard:
1. **Authentication** → **Settings**
2. **Email Auth** → Desactiva **"Enable email confirmations"**
3. Guarda cambios

### En el código:
El código ya está preparado para crear el perfil inmediatamente al registrarse.

## Flujo Actual (con link de confirmación)
1. Usuario se registra
2. Supabase envía email con link
3. Usuario hace clic en el link
4. Cuenta confirmada
5. Usuario puede hacer login

## Flujo con OTP (requiere configuración)
1. Usuario se registra
2. Supabase envía email con código de 6 dígitos
3. Usuario ingresa el código en la app
4. Cuenta confirmada
5. Usuario entra automáticamente a la app

## Recomendación
Para apps móviles, es mejor **deshabilitar la confirmación de email** y permitir que los usuarios usen la app inmediatamente. Puedes agregar verificación de email opcional más tarde.

## Aplicar cambios
Después de cambiar la configuración en Supabase Dashboard, el código actual funcionará correctamente.
