import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/core/config/supabase';
import { EmotionalState, EMOTIONAL_STATES } from '@/core/types/emotions';
import { firebaseService } from './firebaseService';

// Verificar si estamos en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Solo importar Notifications si NO es Expo Go
let Notifications: any = null;
if (!isExpoGo) {
    Notifications = require('expo-notifications');
    
    // Configurar el comportamiento de las notificaciones
    // NO mostrar alertas cuando la app está en primer plano (foreground)
    Notifications.setNotificationHandler({
        handleNotification: async (notification: any) => {
            // Verificar si la notificación es de tipo mensaje/imagen/voz
            const notificationType = notification.request.content.data?.type;
            const isMessageType = ['message_received', 'image_received', 'voice_received'].includes(notificationType);
            
            return {
                // NO mostrar alerta si es un mensaje y la app está activa
                shouldShowAlert: !isMessageType,
                // Siempre reproducir sonido
                shouldPlaySound: true,
                // Siempre actualizar badge
                shouldSetBadge: true,
            };
        },
    });
}

export interface NotificationData {
    type: 'emotion_change' | 'sync_detected' | 'message_received' | 'image_received' | 'voice_received' | 'connection_request';
    emotion?: string;
    partnerId?: string;
    partnerName?: string;
    messageId?: string;
    screen?: string;
}

class NotificationService {
    private expoPushToken: string | null = null;

    /**
     * Inicializar y registrar el dispositivo para notificaciones
     */
    async initialize(userId: string): Promise<string | null> {
        try {
            // Inicializar Firebase primero (para FCM)
            await firebaseService.initialize();

            // Si es Expo Go, no intentar obtener push token
            if (isExpoGo) {
                console.log('⚠️ Push notifications no disponibles en Expo Go. Usa un development build.');
                return null;
            }

            // Verificar si es un dispositivo físico
            if (!Device.isDevice) {
                console.log('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
                return null;
            }

            // Solicitar permisos
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('❌ Permisos de notificación denegados');
                return null;
            }

            // Obtener el token de Expo Push
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'abcd9d33-058f-4176-957c-ae4f785bf3d4',
            });

            this.expoPushToken = tokenData.data;
            console.log('✅ Push token obtenido:', this.expoPushToken);

            // Guardar el token en la base de datos
            await this.saveTokenToDatabase(userId, this.expoPushToken);

            // Configurar canal de notificaciones para Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#EB477E',
                });
            }

            return this.expoPushToken;
        } catch (error) {
            console.error('❌ Error inicializando notificaciones:', error);
            return null;
        }
    }

    /**
     * Guardar el token en la base de datos
     */
    private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('users')
                .update({ 
                    push_token: token,
                    push_token_updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                console.error('❌ Error guardando token:', error);
            } else {
                console.log('✅ Token guardado en BD');
            }
        } catch (error) {
            console.error('❌ Error guardando token:', error);
        }
    }

    /**
     * Enviar notificación de cambio de emoción
     */
    async sendEmotionChangeNotification(
        partnerToken: string,
        partnerName: string,
        newEmotion: EmotionalState
    ): Promise<void> {
        const emotionConfig = EMOTIONAL_STATES[newEmotion];
        
        await this.sendPushNotification({
            to: partnerToken,
            title: `💭 ${partnerName} cambió su estado`,
            body: `Ahora se siente: ${emotionConfig.label} ${emotionConfig.emoji}`,
            data: {
                type: 'emotion_change',
                emotion: newEmotion,
                screen: 'home',
            },
            sound: 'default',
            priority: 'default',
            badge: 1,
        });
    }

    /**
     * Enviar notificación de sincronización detectada
     */
    async sendSyncDetectedNotification(
        partnerToken: string,
        partnerName: string,
        emotion: EmotionalState
    ): Promise<void> {
        const emotionConfig = EMOTIONAL_STATES[emotion];
        
        await this.sendPushNotification({
            to: partnerToken,
            title: '✨ ¡Están sincronizados!',
            body: `Ambos se sienten: ${emotionConfig.label} ${emotionConfig.emoji} - Hablen ahora`,
            data: {
                type: 'sync_detected',
                emotion,
                screen: 'messages',
            },
            sound: 'default',
            priority: 'high',
            badge: 1,
        });
    }

    /**
     * Enviar notificación de mensaje recibido
     * IMPORTANTE: Solo se envía al push_token de la PAREJA, nunca al usuario actual
     */
    async sendMessageNotification(
        partnerToken: string,
        partnerName: string,
        messagePreview: string,
        emotion: EmotionalState
    ): Promise<void> {
        await this.sendPushNotification({
            to: partnerToken,
            title: partnerName,
            body: messagePreview,
            data: {
                type: 'message_received',
                emotion,
                screen: 'messages',
            },
            sound: 'default',
            priority: 'high',
            badge: 1,
        });
    }

    /**
     * Enviar notificación de imagen privada recibida
     * IMPORTANTE: Solo se envía al push_token de la PAREJA, nunca al usuario actual
     */
    async sendImageNotification(
        partnerToken: string,
        partnerName: string
    ): Promise<void> {
        await this.sendPushNotification({
            to: partnerToken,
            title: partnerName,
            body: '📷 Foto privada',
            data: {
                type: 'image_received',
                screen: 'messages',
            },
            sound: 'default',
            priority: 'high',
            badge: 1,
        });
    }

    /**
     * Enviar notificación de nota de voz recibida
     * IMPORTANTE: Solo se envía al push_token de la PAREJA, nunca al usuario actual
     */
    async sendVoiceNoteNotification(
        partnerToken: string,
        partnerName: string,
        duration: number
    ): Promise<void> {
        const durationStr = this.formatDuration(duration);
        
        await this.sendPushNotification({
            to: partnerToken,
            title: partnerName,
            body: `🎤 Nota de voz (${durationStr})`,
            data: {
                type: 'voice_received',
                screen: 'voice-notes',
            },
            sound: 'default',
            priority: 'high',
            badge: 1,
        });
    }

    /**
     * Enviar notificación de solicitud de conexión recibida
     */
    async sendConnectionRequestNotification(
        recipientToken: string,
        senderName: string,
        senderGender: string
    ): Promise<void> {
        const genderEmoji = senderGender === 'male' ? '👨' : '👩';
        
        await this.sendPushNotification({
            to: recipientToken,
            title: `${genderEmoji} Nueva solicitud de conexión`,
            body: `${senderName} quiere conectar contigo`,
            data: {
                type: 'connection_request',
                screen: 'connection-requests',
            },
            sound: 'default',
            priority: 'high',
            badge: 1,
        });
    }

    /**
     * Enviar notificación push usando Expo Push API
     */
    private async sendPushNotification(notification: {
        to: string;
        title: string;
        body: string;
        data?: NotificationData;
        sound?: string;
        priority?: 'default' | 'high';
        badge?: number;
    }): Promise<void> {
        try {
            // Validar que el token no esté vacío
            if (!notification.to || notification.to.trim() === '') {
                console.error('❌ Token de notificación vacío o inválido');
                return;
            }

            const message = {
                to: notification.to,
                sound: notification.sound || 'default',
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                priority: notification.priority || 'high',
                badge: notification.badge,
            };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.data?.status === 'error') {
                console.error('❌ Error enviando notificación:', result.data.message);
                throw new Error(result.data.message);
            } else {
                console.log('✅ Notificación enviada:', notification.title);
            }
        } catch (error) {
            console.error('❌ Error enviando push notification:', error);
            throw error; // Re-lanzar el error para que el llamador pueda manejarlo
        }
    }

    /**
     * Formatear duración de audio
     */
    private formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Limpiar badge de notificaciones
     */
    async clearBadge(): Promise<void> {
        if (!Notifications || isExpoGo) return;
        await Notifications.setBadgeCountAsync(0);
    }

    /**
     * Configurar listener para notificaciones recibidas
     */
    addNotificationReceivedListener(
        callback: (notification: any) => void
    ): any {
        if (!Notifications || isExpoGo) return null;
        return Notifications.addNotificationReceivedListener(callback);
    }

    /**
     * Configurar listener para cuando el usuario toca una notificación
     */
    addNotificationResponseListener(
        callback: (response: any) => void
    ): any {
        if (!Notifications || isExpoGo) return null;
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    /**
     * Obtener el token actual
     */
    getToken(): string | null {
        return this.expoPushToken;
    }
}

export const notificationService = new NotificationService();
