import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationData } from '@/core/services/notificationService';
import { useAuthStore } from '@/core/store/useAuthStore';

// Silenciar advertencias de Expo Go
const originalWarn = console.warn;
console.warn = (...args) => {
    const message = args[0];
    if (
        typeof message === 'string' &&
        (message.includes('expo-notifications') ||
         message.includes('Expo Go'))
    ) {
        return; // Ignorar advertencias de notificaciones en Expo Go
    }
    originalWarn(...args);
};

export function useNotifications() {
    const { user } = useAuthStore();
    const router = useRouter();
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    useEffect(() => {
        if (!user) return;

        // Inicializar notificaciones
        const initNotifications = async () => {
            const token = await notificationService.initialize(user.id);
            if (token) {
                console.log('✅ Notificaciones inicializadas');
            }
        };

        initNotifications();

        // Listener para notificaciones recibidas mientras la app está abierta
        notificationListener.current = notificationService.addNotificationReceivedListener(
            (notification) => {
                console.log('📬 Notificación recibida:', notification);
                // Aquí puedes agregar lógica adicional, como actualizar el estado
            }
        );

        // Listener para cuando el usuario toca una notificación
        responseListener.current = notificationService.addNotificationResponseListener(
            (response) => {
                const data = response.notification.request.content.data as NotificationData;
                console.log('👆 Usuario tocó notificación:', data);

                // Navegar según el tipo de notificación
                if (data.screen) {
                    router.push(data.screen as any);
                }
            }
        );

        // Cleanup
        return () => {
            try {
                if (notificationListener.current && Notifications.removeNotificationSubscription) {
                    Notifications.removeNotificationSubscription(notificationListener.current);
                }
                if (responseListener.current && Notifications.removeNotificationSubscription) {
                    Notifications.removeNotificationSubscription(responseListener.current);
                }
            } catch (error) {
                // Ignorar errores en Expo Go
                console.log('⚠️ Error limpiando listeners (normal en Expo Go)');
            }
        };
    }, [user]);

    return {
        clearBadge: () => notificationService.clearBadge(),
    };
}
