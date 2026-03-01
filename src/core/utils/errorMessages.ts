// Utilidad para convertir errores técnicos en mensajes amigables

export interface FriendlyError {
    title: string;
    message: string;
    emoji: string;
}

export function getFriendlyErrorMessage(error: any): FriendlyError {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';

    // Rate limit de emails
    if (errorMessage.includes('rate limit') || errorMessage.includes('email rate limit exceeded')) {
        return {
            title: 'AURA en Mantenimiento',
            message: 'Estamos actualizando la base de datos para brindarte un mejor servicio a nuestros Aureros. Por favor, inténtalo más tarde. 💜',
            emoji: '🔧'
        };
    }

    // Email ya existe
    if (errorMessage.includes('already registered') || errorMessage.includes('user already registered')) {
        return {
            title: '¡Ya eres parte de AURA!',
            message: 'Este correo ya está registrado. Intenta iniciar sesión o recupera tu contraseña si la olvidaste.',
            emoji: '👋'
        };
    }

    // Credenciales inválidas
    if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid credentials')) {
        return {
            title: 'Credenciales Incorrectas',
            message: 'El correo o la contraseña no son correctos. Verifica tus datos e intenta nuevamente.',
            emoji: '🔐'
        };
    }

    // Email no confirmado
    if (errorMessage.includes('email not confirmed') || errorMessage.includes('email confirmation')) {
        return {
            title: 'Confirma tu Email',
            message: 'Por favor verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.',
            emoji: '📧'
        };
    }

    // Contraseña débil
    if (errorMessage.includes('password') && errorMessage.includes('weak')) {
        return {
            title: 'Contraseña Débil',
            message: 'Tu contraseña debe tener al menos 6 caracteres. Elige una contraseña más segura.',
            emoji: '🔒'
        };
    }

    // Email inválido
    if (errorMessage.includes('invalid email') || errorMessage.includes('email format')) {
        return {
            title: 'Email Inválido',
            message: 'Por favor ingresa un correo electrónico válido.',
            emoji: '📮'
        };
    }

    // Problemas de red
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
        return {
            title: 'Sin Conexión',
            message: 'No pudimos conectarnos al servidor. Verifica tu conexión a internet e intenta nuevamente.',
            emoji: '📡'
        };
    }

    // Código OTP inválido
    if (errorMessage.includes('invalid') && (errorMessage.includes('otp') || errorMessage.includes('token') || errorMessage.includes('code'))) {
        return {
            title: 'Código Incorrecto',
            message: 'El código que ingresaste no es válido o ha expirado. Solicita uno nuevo.',
            emoji: '🔢'
        };
    }

    // Sesión expirada
    if (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('invalid'))) {
        return {
            title: 'Sesión Expirada',
            message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            emoji: '⏰'
        };
    }

    // Usuario no encontrado
    if (errorMessage.includes('user not found') || errorMessage.includes('no user')) {
        return {
            title: 'Usuario No Encontrado',
            message: 'No encontramos una cuenta con ese correo. ¿Quieres registrarte?',
            emoji: '🔍'
        };
    }

    // Timeout
    if (errorMessage.includes('timeout')) {
        return {
            title: 'Tiempo Agotado',
            message: 'La operación tardó demasiado. Por favor intenta nuevamente.',
            emoji: '⏱️'
        };
    }

    // Error genérico pero amigable
    return {
        title: 'Algo Salió Mal',
        message: 'Ocurrió un error inesperado. Por favor intenta nuevamente en unos momentos.',
        emoji: '😅'
    };
}
