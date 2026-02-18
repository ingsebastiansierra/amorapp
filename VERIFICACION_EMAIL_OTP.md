# ✅ Verificación de Email con Código OTP

## 🎯 Problema Resuelto

**Antes:** Al registrarse, Supabase enviaba un link de confirmación que redirigía a una página de error fea.

**Ahora:** El usuario recibe un código de 6 dígitos por email que ingresa directamente en la app, igual que el flujo de recuperar contraseña.

---

## 🔄 Nuevo Flujo de Registro

### 1. Usuario completa el formulario de registro
```
┌─────────────────────────────────┐
│     Crear Cuenta                │
│                                 │
│  [Nombre____________]           │
│  [Email_____________]           │
│  [Contraseña________]           │
│  [Fecha Nacimiento__]           │
│  [Foto (opcional)___]           │
│  [Género____________]           │
│                                 │
│  [  Crear Cuenta  ]             │
└─────────────────────────────────┘
```

### 2. Se envía código OTP al email
```typescript
// En register.tsx
await signUpWithOtp(email, password, name, gender, birthDate, avatarUri);

// Redirige a pantalla de verificación
router.push({
    pathname: '/(auth)/verify-email',
    params: { email, name, gender, birthDate, avatarUri, password }
});
```

### 3. Usuario ingresa el código de 6 dígitos
```
┌─────────────────────────────────┐
│          📧                     │
│     Verifica tu Email           │
│                                 │
│  Código enviado a:              │
│  usuario@email.com              │
│                                 │
│  ┌─────────────────────┐        │
│  │    0 0 0 0 0 0      │        │
│  └─────────────────────┘        │
│                                 │
│  [  Verificar Email  ]          │
│                                 │
│  ¿No recibiste el código?       │
│  Reenviar                       │
└─────────────────────────────────┘
```

### 4. Se verifica el código y se completa el registro
```typescript
// Verificar código OTP
await verifyEmailOtp(email, code);

// Crear usuario con contraseña
await completeSignUp(email, password, name, gender, birthDate, avatarUri);

// Redirigir a login
router.replace('/(auth)/login');
```

---

## 📝 Archivos Modificados

### 1. `app/(auth)/register.tsx`

**Cambio en `handleRegister`:**

```typescript
// ANTES
await signUp(email, password, name, gender, birthDate, avatarUri);
Alert.alert('¡Cuenta creada!', 'Revisa tu email...');

// AHORA
await signUpWithOtp(email, password, name, gender, birthDate, avatarUri);
router.push({
    pathname: '/(auth)/verify-email',
    params: { email, name, gender, birthDate, avatarUri, password }
});
```

### 2. `app/(auth)/verify-email.tsx` (NUEVO)

Pantalla de verificación de código OTP para registro:

```typescript
export default function VerifyEmailScreen() {
    const [code, setCode] = useState('');
    
    const handleVerifyEmail = async () => {
        // Verificar código
        await verifyEmailOtp(email, code);
        
        // Completar registro
        await completeSignUp(email, password, name, gender, birthDate, avatarUri);
        
        // Ir a login
        router.replace('/(auth)/login');
    };
    
    const handleResendCode = async () => {
        // Reenviar código
        await signUpWithOtp(email, password, name, gender, birthDate, avatarUri);
    };
}
```

**Características:**
- ✅ Input de 6 dígitos con formato visual
- ✅ Botón para reenviar código
- ✅ Validación de código
- ✅ Mensajes de error claros
- ✅ Diseño consistente con el resto de la app

### 3. `src/core/store/useAuthStore.ts`

**Nuevas funciones agregadas:**

```typescript
interface AuthState {
  // ... funciones existentes
  signUpWithOtp: (email, password, name, gender, birthDate, avatarUri) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: any }>;
  completeSignUp: (email, password, name, gender, birthDate, avatarUri) => Promise<void>;
}
```

#### `signUpWithOtp`
Envía un código OTP al email sin crear el usuario todavía:

```typescript
signUpWithOtp: async (email, password, name, gender, birthDate, avatarUri) => {
    // Enviar código OTP al email (sin crear usuario aún)
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false, // ⬅️ IMPORTANTE: No crear usuario
            data: { name, gender }
        }
    });
    
    if (error) throw error;
}
```

#### `verifyEmailOtp`
Verifica el código OTP ingresado por el usuario:

```typescript
verifyEmailOtp: async (email: string, token: string) => {
    // Verificar el código OTP
    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
    });

    return { error };
}
```

#### `completeSignUp`
Crea el usuario con contraseña y perfil completo después de verificar el email:

```typescript
completeSignUp: async (email, password, name, gender, birthDate, avatarUri) => {
    // Crear usuario con contraseña
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
            data: { name, gender },
            emailRedirectTo: undefined // ⬅️ No enviar email de confirmación
        },
    });
    
    if (error) throw error;
    
    // Subir avatar si existe
    if (avatarUri) {
        // ... lógica de subida
    }
    
    // Crear perfil en tabla users
    await supabase.from('users').insert({
        id: data.user.id,
        email,
        name,
        gender,
        birth_date,
        avatar_url
    });
}
```

---

## 🎨 Diseño de la Pantalla de Verificación

### Elementos Visuales

1. **Emoji grande** (📧) - Indica que es verificación de email
2. **Título claro** - "Verifica tu Email"
3. **Email destacado** - Muestra a dónde se envió el código
4. **Input de código** - 6 dígitos, centrado, con espaciado
5. **Botón principal** - "Verificar Email"
6. **Botón secundario** - "¿No recibiste el código? Reenviar"
7. **Botón terciario** - "Volver"

### Estilos Consistentes

```typescript
const styles = StyleSheet.create({
    codeInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 20,
        fontSize: 32,
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: 8,  // ⬅️ Espaciado entre dígitos
        fontWeight: 'bold',
    },
    // ... más estilos
});
```

---

## 🔐 Seguridad

### Ventajas del Nuevo Flujo

1. **No hay links públicos** - El código solo funciona con el email correcto
2. **Códigos de un solo uso** - Cada código expira después de usarse
3. **Expiración automática** - Los códigos expiran después de cierto tiempo
4. **Validación en la app** - Todo el flujo ocurre dentro de la app
5. **Sin páginas externas** - No hay riesgo de phishing con páginas falsas

### Validaciones Implementadas

```typescript
// Validar longitud del código
if (code.length !== 6) {
    Alert.alert('Error', 'El código debe tener 6 dígitos');
    return;
}

// Solo números
onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}

// Máximo 6 caracteres
maxLength={6}
```

---

## 📧 Email que Recibe el Usuario

El usuario recibirá un email de Supabase con:

```
Asunto: Confirma tu email

Hola,

Tu código de verificación es: 123456

Este código expirará en 60 minutos.

Si no solicitaste este código, ignora este email.

Saludos,
El equipo de Palpitos
```

---

## 🔄 Flujo de Reenvío de Código

Si el usuario no recibe el código o expira:

```typescript
const handleResendCode = async () => {
    setResending(true);
    try {
        // Reenviar código OTP
        await signUpWithOtp(email, password, name, gender, birthDate, avatarUri);
        Alert.alert('Código reenviado', 'Revisa tu email nuevamente');
    } catch (error) {
        Alert.alert('Error', error.message);
    } finally {
        setResending(false);
    }
};
```

**Características:**
- ✅ Botón con estado de carga
- ✅ Mensaje de confirmación
- ✅ Manejo de errores
- ✅ No requiere volver atrás

---

## ⚠️ Configuración en Supabase

### Personalizar el Email (Opcional)

1. Ve a Supabase Dashboard
2. Authentication → Email Templates
3. Selecciona "Magic Link"
4. Personaliza el contenido:

```html
<h2>Confirma tu email</h2>
<p>Hola,</p>
<p>Tu código de verificación es: <strong>{{ .Token }}</strong></p>
<p>Este código expirará en 60 minutos.</p>
<p>Si no solicitaste este código, ignora este email.</p>
```

### Configurar Tiempo de Expiración

1. Authentication → Settings
2. "OTP Expiry" → Cambiar a 3600 segundos (60 minutos)

---

## 🎯 Comparación: Antes vs Ahora

### ANTES ❌

```
1. Usuario se registra
2. Supabase envía link de confirmación
3. Usuario hace clic en el link
4. Redirige a página web fea de error
5. Usuario confundido
6. Tiene que volver a la app manualmente
```

### AHORA ✅

```
1. Usuario se registra
2. Supabase envía código de 6 dígitos
3. Usuario ingresa código en la app
4. Código se verifica
5. Cuenta creada exitosamente
6. Redirige automáticamente al login
```

---

## 🚀 Ventajas del Nuevo Flujo

1. ✅ **Mejor UX** - Todo ocurre dentro de la app
2. ✅ **Sin páginas de error** - No hay redirecciones externas
3. ✅ **Más seguro** - Códigos de un solo uso
4. ✅ **Consistente** - Igual que recuperar contraseña
5. ✅ **Profesional** - Experiencia pulida y moderna
6. ✅ **Fácil de usar** - Solo 6 dígitos
7. ✅ **Reenvío simple** - Botón para reenviar código

---

## 🧪 Cómo Probar

### 1. Registro Normal

```bash
1. Abre la app
2. Ve a "Crear Cuenta"
3. Completa el formulario
4. Presiona "Crear Cuenta"
5. Verás la pantalla de verificación
6. Revisa tu email
7. Ingresa el código de 6 dígitos
8. Presiona "Verificar Email"
9. Deberías ver "¡Cuenta verificada!"
10. Serás redirigido al login
```

### 2. Reenvío de Código

```bash
1. En la pantalla de verificación
2. Presiona "¿No recibiste el código? Reenviar"
3. Verás "Código reenviado"
4. Revisa tu email nuevamente
5. Ingresa el nuevo código
```

### 3. Código Inválido

```bash
1. Ingresa un código incorrecto
2. Presiona "Verificar Email"
3. Verás "Código inválido o expirado"
4. Intenta con el código correcto
```

---

## 📝 Notas Importantes

- ⚠️ El código OTP expira después de 60 minutos
- ✅ Puedes reenviar el código cuantas veces quieras
- 🔒 El código solo funciona con el email correcto
- 📧 Revisa la carpeta de spam si no recibes el email
- 🎨 El diseño es consistente con el resto de la app

---

## 🔧 Troubleshooting

### "No recibo el email"
1. Verifica que el email esté correcto
2. Revisa la carpeta de spam
3. Espera 1-2 minutos
4. Usa el botón "Reenviar"

### "Código inválido o expirado"
1. Verifica que ingresaste los 6 dígitos correctos
2. El código expira después de 60 minutos
3. Solicita un nuevo código con "Reenviar"

### "Error al crear cuenta"
1. Verifica tu conexión a internet
2. Asegúrate de que Supabase esté configurado
3. Revisa los logs de la consola

---

**¡Listo!** El flujo de verificación de email ahora es mucho más profesional y fácil de usar. 🎉
