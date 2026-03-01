// Utilidad de logging que solo muestra en desarrollo
// En producción, los logs no se muestran a los usuarios

const isDevelopment = __DEV__;

export const logger = {
    log: (...args: any[]) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    
    info: (...args: any[]) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },
    
    warn: (...args: any[]) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    
    error: (...args: any[]) => {
        if (isDevelopment) {
            console.error(...args);
        }
        // En producción, podrías enviar a un servicio de monitoreo como Sentry
        // Sentry.captureException(args[0]);
    },
    
    debug: (...args: any[]) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    }
};
