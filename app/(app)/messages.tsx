import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform, Modal, Dimensions, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ScreenCapture from 'expo-screen-capture';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { EMOTIONAL_STATES } from '@/core/types/emotions';
import { EmotionalState } from '@/core/types/emotions';
import { avatarService } from '@/core/services/avatarService';
import { ImageAttachButton } from '@/shared/components/ImageAttachButton';
import { VoiceRecorderButton } from '@/shared/components/VoiceRecorderButton';
import { VoiceMessagePlayer } from '@/shared/components/VoiceMessagePlayer';
import { mediaService } from '@/core/services/mediaService';
import { notificationService } from '@/core/services/notificationService';
import { useChatBackgroundStore } from '@/core/store/useChatBackgroundStore';
import { getMessageThemeColors } from '@/core/config/messageThemes';
import { SwipeableMessage } from '@/shared/components/SwipeableMessage';
import { galleryService } from '@/core/services/galleryService';

const { width, height } = Dimensions.get('window');

interface Message {
    id: string;
    message: string;
    synced_emotion: string;
    created_at: string;
    from_user_id: string;
    read: boolean;
    type?: 'text' | 'image' | 'voice';
    image_id?: string;
    image_expired?: boolean;
    voice_id?: string;
    voice_duration?: number;
    voice_storage_path?: string;
    voice_listened?: boolean;
    voice_waveform?: number[];
    reply_to_message_id?: string | null;
    replied_message?: {
        id: string;
        message: string;
        from_user_id: string;
        type?: 'text' | 'image' | 'voice';
    } | null;
}

interface PartnerInfo {
    id: string;
    name: string;
    avatar_url: string | null;
    last_seen: string | null;
    push_token: string | null;
}

export default function MessagesScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [partner, setPartner] = useState<PartnerInfo | null>(null);
    const [myProfile, setMyProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [myCurrentEmotion, setMyCurrentEmotion] = useState<EmotionalState | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [viewingImage, setViewingImage] = useState<{ id: string; url: string; caption?: string } | null>(null);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
    const [showPartnerProfile, setShowPartnerProfile] = useState(false);
    const [partnerPhotos, setPartnerPhotos] = useState<any[]>([]);
    const [viewingPartnerPhoto, setViewingPartnerPhoto] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const shouldScrollToEnd = useRef(true); // Controla si debe hacer scroll al final
    const messageRefs = useRef<Record<string, any>>({});
    const { backgroundImage, backgroundOpacity, messageColorTheme, setBackgroundImage, setBackgroundOpacity, loadBackground, clearBackground } = useChatBackgroundStore();

    // Obtener colores del tema seleccionado
    const themeColors = getMessageThemeColors(messageColorTheme);

    // Función para reproducir sonido de envío
    const playSendSound = async () => {
        try {
            // Configurar el modo de audio
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: false,
                staysActiveInBackground: false,
            });

            // Crear un efecto de sonido con haptics en secuencia
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 50);
        } catch (error) {
            // Fallback a solo haptics
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    useEffect(() => {
        loadMyProfile();
        loadPartnerInfo();
        loadMyCurrentEmotion();
        updateLastSeen(); // Registrar que el usuario entró al chat
        loadBackground(); // Cargar fondo del chat

        // Polling para actualizar la emoción cada 3 segundos
        const emotionInterval = setInterval(loadMyCurrentEmotion, 3000);

        // Actualizar last_seen cada 30 segundos mientras está en el chat
        const lastSeenInterval = setInterval(updateLastSeen, 30000);

        return () => {
            clearInterval(emotionInterval);
            clearInterval(lastSeenInterval);
        };
    }, []);

    useEffect(() => {
        if (user) {
            loadMessages();

            // Suscripción en tiempo real para mensajes nuevos
            const channel = supabase
                .channel('sync-messages-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'sync_messages',
                        filter: `to_user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('📨 Nuevo mensaje recibido en tiempo real:', payload);
                        // Recargar mensajes cuando llega uno nuevo
                        loadMessages();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'sync_messages',
                        filter: `to_user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('📝 Mensaje actualizado en tiempo real:', payload);
                        // Recargar mensajes cuando se actualiza uno (ej: marcado como leído)
                        loadMessages();
                    }
                )
                .subscribe();

            // Polling de respaldo cada 30 segundos (reducido de 5)
            const interval = setInterval(loadMessages, 30000);

            return () => {
                supabase.removeChannel(channel);
                clearInterval(interval);
            };
        }
    }, [user, partner]);

    // Polling para actualizar info de la pareja (incluyendo last_seen)
    useEffect(() => {
        if (partner) {
            const partnerInterval = setInterval(loadPartnerInfo, 10000); // Cada 10 segundos (reducido de 5)
            return () => clearInterval(partnerInterval);
        }
    }, [partner]);

    const loadMyProfile = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('users')
                .select('name, avatar_url')
                .eq('id', user.id)
                .maybeSingle();

            if (data) {
                setMyProfile(data);
            }
        } catch (error) {
            // Error loading profile
        }
    };

    const loadPartnerInfo = async () => {
        if (!user) return;

        try {
            const { data: myData } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!myData?.couple_id) return;

            const { data: coupleData } = await supabase
                .from('couples')
                .select('user1_id, user2_id')
                .eq('id', myData.couple_id)
                .maybeSingle();

            if (!coupleData) return;

            const partnerId = coupleData.user1_id === user.id
                ? coupleData.user2_id
                : coupleData.user1_id;

            const { data: partnerData } = await supabase
                .from('users')
                .select('id, name, avatar_url, last_seen, push_token')
                .eq('id', partnerId)
                .maybeSingle();

            if (partnerData) {
                setPartner(partnerData);
            }
        } catch (error) {
            // Error loading partner
        }
    };

    const loadMyCurrentEmotion = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('emotional_states')
                .select('state')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                setMyCurrentEmotion(data.state as EmotionalState);
            }
        } catch (error) {
            // Error loading emotion
        }
    };

    const updateLastSeen = async () => {
        if (!user) return;

        try {
            await supabase
                .from('users')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', user.id);
        } catch (error) {
            // Error updating last_seen
        }
    };

    const formatLastSeen = (lastSeenDate: string | null) => {
        if (!lastSeenDate) return 'Sin conexión';

        const date = new Date(lastSeenDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        // Considerar en línea si la última actualización fue hace menos de 2 minutos
        if (diffMins < 2) return 'En línea';

        // Verificar si es hoy
        const isToday = date.toDateString() === now.toDateString();

        // Verificar si es ayer
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        // Formatear hora
        const timeStr = date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        if (isToday) {
            return `Últ. vez hoy a las ${timeStr}`;
        } else if (isYesterday) {
            return `Últ. vez ayer a las ${timeStr}`;
        } else {
            // Fecha completa para días anteriores
            const dateStr = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            return `Últ. vez ${dateStr} a las ${timeStr}`;
        }
    };

    const loadMessages = async () => {
        if (!user) return;

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!userData?.couple_id) {
                return;
            }

            // Cargar mensajes de texto
            const { data: messagesData, error: messagesError } = await supabase
                .from('sync_messages')
                .select('*')
                .eq('couple_id', userData.couple_id)
                .order('created_at', { ascending: true });

            if (messagesError) {
                return;
            }

            // Si hay mensajes con reply_to_message_id, cargar los mensajes citados
            const messageIds = (messagesData || [])
                .map(msg => msg.reply_to_message_id)
                .filter(id => id != null);

            let repliedMessagesMap: Record<string, any> = {};

            if (messageIds.length > 0) {
                const { data: repliedMessages } = await supabase
                    .from('sync_messages')
                    .select('id, message, from_user_id')
                    .in('id', messageIds);

                if (repliedMessages) {
                    repliedMessagesMap = repliedMessages.reduce((acc, msg) => {
                        acc[msg.id] = msg;
                        return acc;
                    }, {} as Record<string, any>);
                }
            }

            // Cargar imágenes privadas como mensajes
            const { data: imagesData, error: imagesError } = await supabase
                .from('images_private')
                .select('*')
                .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
                .order('created_at', { ascending: true });

            if (imagesError) {
                // Error loading images
            }

            // Cargar notas de voz como mensajes
            const { data: voiceData, error: voiceError } = await supabase
                .from('voice_notes')
                .select('*')
                .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
                .order('created_at', { ascending: true });

            if (voiceError) {
                // Error loading voice notes
            }

            // Combinar mensajes, imágenes y notas de voz
            const textMessages: Message[] = (messagesData || []).map(msg => ({
                ...msg,
                type: 'text' as const,
                replied_message: msg.reply_to_message_id && repliedMessagesMap[msg.reply_to_message_id]
                    ? {
                        id: repliedMessagesMap[msg.reply_to_message_id].id,
                        message: repliedMessagesMap[msg.reply_to_message_id].message,
                        from_user_id: repliedMessagesMap[msg.reply_to_message_id].from_user_id,
                        type: 'text' as const,
                    }
                    : null,
            }));

            const imageMessages: Message[] = (imagesData || []).map(img => ({
                id: img.id,
                message: img.caption || '📷 Imagen privada',
                synced_emotion: 'happy', // Emoción por defecto para imágenes
                created_at: img.created_at,
                from_user_id: img.from_user_id,
                read: img.viewed || false,
                type: 'image' as const,
                image_id: img.id,
                image_expired: img.is_expired || false,
            }));

            const voiceMessages: Message[] = (voiceData || []).map(voice => ({
                id: voice.id,
                message: '🎤 Nota de voz',
                synced_emotion: 'happy', // Emoción por defecto para voz
                created_at: voice.created_at,
                from_user_id: voice.from_user_id,
                read: voice.listened || false,
                type: 'voice' as const,
                voice_id: voice.id,
                voice_duration: voice.duration,
                voice_storage_path: voice.storage_path,
                voice_listened: voice.listened || false,
                voice_waveform: voice.waveform_data?.data || [],
            }));

            // Combinar y ordenar por fecha
            const allMessages = [...textMessages, ...imageMessages, ...voiceMessages].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            setMessages(allMessages);

            // Scroll al final solo si la bandera está activa (primera carga o después de enviar)
            if (shouldScrollToEnd.current) {
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: false });
                }, 100);
                shouldScrollToEnd.current = false; // Desactivar después del primer scroll
            }

            // Marcar como leídos los mensajes de texto recibidos
            const unreadIds = (messagesData || [])
                .filter(msg => msg.to_user_id === user.id && !msg.read)
                .map(msg => msg.id);

            if (unreadIds.length > 0) {
                await supabase
                    .from('sync_messages')
                    .update({ read: true })
                    .in('id', unreadIds);
            }
        } catch (error) {
            // Error loading messages
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays === 1) return 'Ayer';
        return date.toLocaleDateString('es-ES');
    };

    const groupMessagesByDate = () => {
        const groups: { [key: string]: Message[] } = {};

        // Filtrar mensajes por búsqueda
        const filteredMessages = searchQuery.trim()
            ? messages.filter(msg =>
                msg.message.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : messages;

        filteredMessages.forEach(msg => {
            const date = new Date(msg.created_at);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let label = '';
            if (date.toDateString() === today.toDateString()) {
                label = 'HOY';
            } else if (date.toDateString() === yesterday.toDateString()) {
                label = 'AYER';
            } else {
                label = date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
            }

            if (!groups[label]) {
                groups[label] = [];
            }
            groups[label].push(msg);
        });

        return groups;
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !partner || !user) {
            return;
        }

        const messageText = newMessage.trim();
        const emotionToUse: EmotionalState = myCurrentEmotion || EmotionalState.NORMAL;
        const replyToId = replyingTo?.id || null;

        // Limpiar input y respuesta inmediatamente para mejor UX
        setNewMessage('');
        setReplyingTo(null);

        // Crear mensaje optimista (se muestra inmediatamente)
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            message: messageText,
            synced_emotion: emotionToUse,
            created_at: new Date().toISOString(),
            from_user_id: user.id,
            read: false,
            type: 'text',
            reply_to_message_id: replyToId,
            replied_message: replyingTo ? {
                id: replyingTo.id,
                message: replyingTo.message,
                from_user_id: replyingTo.from_user_id,
                type: replyingTo.type,
            } : null,
        };

        // Agregar mensaje optimista a la UI
        setMessages(prev => [...prev, optimisticMessage]);

        // Activar scroll automático para este mensaje
        shouldScrollToEnd.current = true;

        // Scroll al final inmediatamente
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);

        // Reproducir sonido y haptic feedback
        playSendSound();

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('couple_id, name')
                .eq('id', user.id)
                .maybeSingle();

            if (!userData?.couple_id) {
                // Remover mensaje optimista si falla
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
                Alert.alert('Error', 'No se pudo enviar el mensaje. No tienes pareja vinculada.');
                return;
            }

            const { data: insertedMessage, error } = await supabase
                .from('sync_messages')
                .insert({
                    couple_id: userData.couple_id,
                    from_user_id: user.id,
                    to_user_id: partner.id,
                    message: messageText,
                    synced_emotion: emotionToUse,
                    reply_to_message_id: replyToId,
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Error enviando mensaje:', error);
                // Remover mensaje optimista si falla
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));

                // Mostrar error específico al usuario
                if (error.message.includes('Demasiados mensajes')) {
                    Alert.alert('Espera un momento', 'Estás enviando mensajes muy rápido. Espera unos segundos.');
                } else if (error.message.includes('message_length')) {
                    Alert.alert('Mensaje muy largo', 'El mensaje no puede tener más de 500 caracteres.');
                } else {
                    Alert.alert('Error', 'No se pudo enviar el mensaje. Intenta de nuevo.');
                }
                return;
            }

            // Reemplazar mensaje optimista con el real (sin recargar todo)
            if (insertedMessage) {
                setMessages(prev => prev.map(m =>
                    m.id === optimisticMessage.id
                        ? { ...insertedMessage, type: 'text' as const, replied_message: optimisticMessage.replied_message }
                        : m
                ));
            }

            // Enviar notificación push a la pareja
            if (partner.push_token && userData.name) {
                try {
                    await notificationService.sendMessageNotification(
                        partner.push_token,
                        userData.name,
                        messageText,
                        emotionToUse
                    );
                } catch (notifError) {
                    console.error('⚠️ Error enviando notificación (mensaje ya guardado):', notifError);
                    // No fallar el envío del mensaje si solo falla la notificación
                }
            }
        } catch (error) {
            console.error('❌ Error general en handleSendMessage:', error);
            // Remover mensaje optimista si hay error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            Alert.alert('Error', 'No se pudo enviar el mensaje. Verifica tu conexión.');
        }
    };

    const handleOpenImage = async (imageId: string) => {
        try {
            setIsLoadingImage(true);

            // Obtener datos de la imagen
            const { data: imageData, error } = await supabase
                .from('images_private')
                .select('*')
                .eq('id', imageId)
                .single();

            if (error || !imageData) {
                Alert.alert('Error', 'No se pudo cargar la imagen');
                return;
            }

            if (imageData.is_expired) {
                Alert.alert('No disponible', 'Esta imagen ya no está disponible');
                return;
            }

            // Obtener URL firmada
            const url = await mediaService.getImageUrl(imageData.storage_path);

            setViewingImage({
                id: imageId,
                url,
                caption: imageData.caption
            });

            // Bloquear capturas de pantalla
            ScreenCapture.preventScreenCaptureAsync();
        } catch (error) {
            Alert.alert('Error', 'No se pudo cargar la imagen');
        } finally {
            setIsLoadingImage(false);
        }
    };

    const handleCloseImage = async () => {
        if (!viewingImage) return;

        try {
            // Marcar como vista
            const { error } = await supabase
                .from('images_private')
                .update({
                    viewed: true,
                    is_expired: true,
                    view_count: 1
                })
                .eq('id', viewingImage.id);

            if (error) {
                // Error marking as viewed
            }

            // Desbloquear capturas
            ScreenCapture.allowScreenCaptureAsync();

            setViewingImage(null);

            // Recargar mensajes para actualizar el estado
            loadMessages();
        } catch (error) {
            setViewingImage(null);
        }
    };

    const handleSelectBackground = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            await setBackgroundImage(result.assets[0].uri);
            setShowBackgroundMenu(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleClearBackground = async () => {
        await clearBackground();
        setShowBackgroundMenu(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleOpenPartnerProfile = async () => {
        if (!partner) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowPartnerProfile(true);

        // Cargar fotos públicas de la pareja
        try {
            const { data: photos } = await supabase
                .from('personal_gallery')
                .select('*')
                .eq('user_id', partner.id)
                .eq('visibility', 'visible')
                .order('created_at', { ascending: false })
                .limit(6);

            if (photos) {
                setPartnerPhotos(photos);
            }
        } catch (error) {
            console.error('Error loading partner photos:', error);
        }
    };

    const handleViewPartnerPhoto = (photoUrl: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setViewingPartnerPhoto(photoUrl);
    };

    const handleViewPartnerAvatar = () => {
        if (!partner?.avatar_url) return;
        const avatarUrl = avatarService.getAvatarUrl(partner.avatar_url);
        if (avatarUrl) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setViewingPartnerPhoto(avatarUrl);
        }
    };

    const handleScrollToMessage = (messageId: string) => {
        // Buscar el mensaje en la lista
        const messageIndex = messages.findIndex(m => m.id === messageId);

        if (messageIndex === -1) {
            Alert.alert('Mensaje no encontrado', 'El mensaje citado ya no está disponible.');
            return;
        }

        // Hacer scroll al mensaje
        const messageRef = messageRefs.current[messageId];
        if (messageRef) {
            messageRef.measureLayout(
                scrollViewRef.current,
                (x: number, y: number) => {
                    // Scroll con un poco más de espacio arriba para mejor visibilidad
                    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 150), animated: true });

                    // Resaltar el mensaje temporalmente
                    setHighlightedMessageId(messageId);

                    // Feedback háptico más notorio
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                    // Quitar el resaltado después de 3 segundos (aumentado de 2)
                    setTimeout(() => {
                        setHighlightedMessageId(null);
                    }, 3000);
                },
                () => {
                    // Error en measureLayout - intentar scroll básico
                    console.log('Error en measureLayout, intentando scroll básico');
                    Alert.alert('Error', 'No se pudo navegar al mensaje citado.');
                }
            );
        } else {
            Alert.alert('Error', 'No se pudo encontrar el mensaje en la pantalla.');
        }
    };

    const renderMessage = (msg: Message) => {
        const isFromMe = msg.from_user_id === user?.id;
        const emotionConfig = EMOTIONAL_STATES[msg.synced_emotion as EmotionalState];
        const isImage = msg.type === 'image';
        const isVoice = msg.type === 'voice';

        return (
            <SwipeableMessage
                key={msg.id}
                onReply={() => setReplyingTo(msg)}
                isFromMe={isFromMe}
            >
                <View style={[styles.messageRow, isFromMe && styles.messageRowMe]}>
                    <Pressable
                        style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, flex: 1 }}
                        onPress={() => {
                            if (isImage && msg.image_id && !isFromMe && !msg.image_expired) {
                                handleOpenImage(msg.image_id);
                            }
                        }}
                        disabled={!isImage || isFromMe || msg.image_expired}
                    >
                        {!isFromMe && partner?.avatar_url && (
                            <Image
                                source={{ uri: avatarService.getAvatarUrl(partner.avatar_url) || undefined }}
                                style={styles.messageAvatar}
                            />
                        )}

                        <View
                            ref={(ref) => { if (ref) messageRefs.current[msg.id] = ref; }}
                            style={[
                                styles.messageBubble,
                                isFromMe ? [styles.messageBubbleMe, { backgroundColor: themeColors.sentBackground }] : [styles.messageBubblePartner, { backgroundColor: themeColors.receivedBackground }],
                                isImage && styles.messageBubbleImage,
                                isVoice && styles.messageBubbleVoice,
                                highlightedMessageId === msg.id && styles.messageBubbleHighlighted
                            ]}
                        >
                            <View style={styles.messageHeader}>
                                <Text style={styles.messageEmoji}>
                                    {isImage ? '📷' : isVoice ? '🎤' : (emotionConfig?.emoji || '💕')}
                                </Text>
                                <Text style={[styles.messageTime, isFromMe && styles.messageTimeMe]}>
                                    {formatTime(msg.created_at)}
                                </Text>
                            </View>

                            {/* Mensaje citado */}
                            {msg.replied_message && (
                                <Pressable
                                    style={[
                                        styles.quotedMessage,
                                        isFromMe ? styles.quotedMessageMe : styles.quotedMessagePartner
                                    ]}
                                    onPress={() => handleScrollToMessage(msg.replied_message!.id)}
                                >
                                    <View style={[
                                        styles.quotedMessageBar,
                                        isFromMe ? styles.quotedMessageBarMe : styles.quotedMessageBarPartner
                                    ]} />
                                    <View style={styles.quotedMessageContent}>
                                        <Text style={[
                                            styles.quotedMessageName,
                                            isFromMe ? styles.quotedMessageNameMe : styles.quotedMessageNamePartner
                                        ]}>
                                            {msg.replied_message.from_user_id === user?.id ? 'Tú' : partner?.name || 'Pareja'}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.quotedMessageText,
                                                isFromMe ? styles.quotedMessageTextMe : styles.quotedMessageTextPartner
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {msg.replied_message.type === 'voice' ? '🎤 Nota de voz' :
                                                msg.replied_message.type === 'image' ? '📷 Imagen' :
                                                    msg.replied_message.message}
                                        </Text>
                                    </View>
                                </Pressable>
                            )}

                            {isVoice && msg.voice_id && msg.voice_storage_path && msg.voice_duration ? (
                                <VoiceMessagePlayer
                                    voiceId={msg.voice_id}
                                    storagePath={msg.voice_storage_path}
                                    duration={msg.voice_duration}
                                    waveform={msg.voice_waveform}
                                    isFromMe={isFromMe}
                                    onListened={() => {
                                        loadMessages();
                                    }}
                                />
                            ) : isVoice && msg.voice_id && !msg.voice_storage_path ? (
                                <View style={styles.voiceSendingContainer}>
                                    <Ionicons name="mic" size={20} color={isFromMe ? themeColors.sentText : themeColors.receivedText} />
                                    <Text style={[styles.messageText, isFromMe ? { color: themeColors.sentText } : { color: themeColors.receivedText }]}>
                                        Enviando nota de voz...
                                    </Text>
                                </View>
                            ) : isImage ? (
                                <View>
                                    <Text style={[styles.messageText, isFromMe ? { color: themeColors.sentText } : { color: themeColors.receivedText }]}>
                                        {msg.message}
                                    </Text>
                                    {msg.image_expired ? (
                                        <Text style={[styles.imageStatus, isFromMe && styles.imageStatusMe]}>
                                            ✓ Vista
                                        </Text>
                                    ) : !isFromMe ? (
                                        <Text style={[styles.imageStatus, styles.imageStatusUnread]}>
                                            👆 Toca para ver (una vez)
                                        </Text>
                                    ) : (
                                        <Text style={[styles.imageStatus, isFromMe && styles.imageStatusMe]}>
                                            Enviada
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                <Text style={[styles.messageText, isFromMe ? { color: themeColors.sentText } : { color: themeColors.receivedText }]}>
                                    {msg.message}
                                </Text>
                            )}
                        </View>

                        {isFromMe && myProfile?.avatar_url && (
                            <Image
                                source={{ uri: avatarService.getAvatarUrl(myProfile.avatar_url) || undefined }}
                                style={styles.messageAvatar}
                            />
                        )}
                    </Pressable>
                </View>
            </SwipeableMessage>
        );
    };

    const groupedMessages = groupMessagesByDate();

    // Obtener el color de fondo basado en la emoción actual
    const backgroundColor = myCurrentEmotion
        ? EMOTIONAL_STATES[myCurrentEmotion]?.gradient[1] || '#F8F6F6'
        : '#F8F6F6';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#181113" />
                    </Pressable>

                    {!showSearch ? (
                        <>
                            <View style={styles.headerCenter}>
                                {partner?.avatar_url && (
                                    <Pressable onPress={handleViewPartnerAvatar}>
                                        <Image
                                            source={{ uri: avatarService.getAvatarUrl(partner.avatar_url) || undefined }}
                                            style={styles.headerAvatar}
                                        />
                                    </Pressable>
                                )}
                                <Pressable
                                    onPress={handleOpenPartnerProfile}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ flex: 1 }}
                                >
                                    <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                                        {partner?.name || 'Pareja'}
                                    </Text>
                                    <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                                        {partner?.last_seen ? formatLastSeen(partner.last_seen) : 'Sin conexión'}
                                    </Text>
                                </Pressable>
                            </View>

                            <View style={styles.headerActions}>
                                <Pressable
                                    onPress={() => setShowBackgroundMenu(true)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={styles.headerButton}
                                >
                                    <Ionicons name="image-outline" size={24} color="#181113" />
                                </Pressable>
                                <Pressable
                                    onPress={() => setShowSearch(true)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={styles.searchButton}
                                >
                                    <Ionicons name="search" size={24} color="#181113" />
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar mensajes..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            <Pressable
                                onPress={() => {
                                    setShowSearch(false);
                                    setSearchQuery('');
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#181113" />
                            </Pressable>
                        </>
                    )}
                </View>

                {/* Messages */}
                <ImageBackground
                    source={backgroundImage ? { uri: backgroundImage } : undefined}
                    style={[styles.messagesContainer, { backgroundColor }]}
                    imageStyle={{ opacity: backgroundOpacity }}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesScrollView}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {Object.keys(groupedMessages).length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyEmoji}>💌</Text>
                                <Text style={styles.emptyText}>No hay mensajes aún</Text>
                                <Text style={styles.emptySubtext}>Inicia una conversación con tu pareja</Text>
                            </View>
                        ) : (
                            Object.entries(groupedMessages).map(([date, msgs]) => (
                                <View key={date}>
                                    <View style={styles.dateLabel}>
                                        <Text style={styles.dateLabelText}>{date}</Text>
                                    </View>
                                    {msgs.map(renderMessage)}
                                </View>
                            ))
                        )}
                    </ScrollView>
                </ImageBackground>

                {/* Input de mensaje */}
                <View style={styles.inputContainerWrapper}>
                    {/* Preview del mensaje al que se está respondiendo */}
                    {replyingTo && (
                        <View style={styles.replyPreview}>
                            <View style={styles.replyPreviewContent}>
                                <View style={styles.replyPreviewBar} />
                                <View style={styles.replyPreviewText}>
                                    <Text style={styles.replyPreviewName}>
                                        {replyingTo.from_user_id === user?.id ? 'Tú' : partner?.name || 'Pareja'}
                                    </Text>
                                    <Text style={styles.replyPreviewMessage} numberOfLines={1}>
                                        {replyingTo.type === 'voice' ? '🎤 Nota de voz' :
                                            replyingTo.type === 'image' ? '📷 Imagen' :
                                                replyingTo.message}
                                    </Text>
                                </View>
                            </View>
                            <Pressable
                                onPress={() => setReplyingTo(null)}
                                style={styles.replyPreviewClose}
                            >
                                <Ionicons name="close" size={20} color="#6B7280" />
                            </Pressable>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        {partner && (
                            <View style={styles.imageButtonWrapper}>
                                <ImageAttachButton
                                    toUserId={partner.id}
                                    onSent={() => {
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        loadMessages();
                                    }}
                                    size={28}
                                    color="#EB477E"
                                />
                            </View>
                        )}

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Mensaje..."
                                placeholderTextColor="#9CA3AF"
                                value={newMessage}
                                onChangeText={setNewMessage}
                                multiline
                                maxLength={500}
                            />
                            {newMessage.length > 0 && (
                                <Text style={styles.charCounter}>
                                    {newMessage.length}/500
                                </Text>
                            )}
                        </View>

                        {/* Mostrar botón de voz cuando no hay texto, botón de enviar cuando hay texto */}
                        {!newMessage.trim() && partner ? (
                            <View style={styles.voiceButtonWrapper}>
                                <VoiceRecorderButton
                                    toUserId={partner.id}
                                    onOptimisticSend={(tempId, duration) => {
                                        // Crear mensaje optimista de voz
                                        const optimisticVoiceMessage: Message = {
                                            id: tempId,
                                            message: '🎤 Nota de voz',
                                            synced_emotion: 'happy',
                                            created_at: new Date().toISOString(),
                                            from_user_id: user!.id,
                                            read: false,
                                            type: 'voice',
                                            voice_id: tempId,
                                            voice_duration: duration,
                                            voice_storage_path: '',
                                            voice_listened: false,
                                            voice_waveform: [],
                                        };

                                        // Agregar mensaje optimista a la UI
                                        setMessages(prev => [...prev, optimisticVoiceMessage]);

                                        // Activar scroll automático para este mensaje
                                        shouldScrollToEnd.current = true;

                                        // Scroll al final inmediatamente
                                        setTimeout(() => {
                                            scrollViewRef.current?.scrollToEnd({ animated: true });
                                        }, 50);
                                    }}
                                    onSent={() => {
                                        // Recargar mensajes cuando realmente se envíe
                                        loadMessages();
                                    }}
                                    size={24}
                                    color="#EB477E"
                                />
                            </View>
                        ) : (
                            <Pressable
                                style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                                onPress={handleSendMessage}
                                disabled={!newMessage.trim()}
                            >
                                <Ionicons name="send" size={24} color={newMessage.trim() ? "#EB477E" : "#D1D5DB"} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Modal para ver imagen privada */}
                <Modal
                    visible={!!viewingImage}
                    transparent={false}
                    animationType="fade"
                    onRequestClose={handleCloseImage}
                >
                    <View style={styles.imageModalContainer}>
                        {viewingImage && (
                            <>
                                <Image
                                    source={{ uri: viewingImage.url }}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />

                                {viewingImage.caption && (
                                    <View style={styles.captionOverlay}>
                                        <Text style={styles.captionText}>{viewingImage.caption}</Text>
                                    </View>
                                )}

                                <Pressable style={styles.closeImageButton} onPress={handleCloseImage}>
                                    <Text style={styles.closeImageButtonText}>✕</Text>
                                </Pressable>

                                <View style={styles.warningOverlay}>
                                    <Text style={styles.warningText}>
                                        🔥 Esta imagen se autodestruirá al cerrar
                                    </Text>
                                </View>

                                <View style={styles.protectionOverlay}>
                                    <Text style={styles.protectionText}>🔒 Capturas bloqueadas</Text>
                                </View>
                            </>
                        )}
                    </View>
                </Modal>

                {/* Modal para ver foto ampliada de la pareja */}
                <Modal
                    visible={!!viewingPartnerPhoto}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setViewingPartnerPhoto(null)}
                >
                    <Pressable
                        style={styles.photoViewerOverlay}
                        onPress={() => setViewingPartnerPhoto(null)}
                    >
                        <View style={styles.photoViewerContent}>
                            {viewingPartnerPhoto && (
                                <Image
                                    source={{ uri: viewingPartnerPhoto }}
                                    style={styles.photoViewerImage}
                                    resizeMode="contain"
                                />
                            )}
                            <Pressable
                                style={styles.photoViewerClose}
                                onPress={() => setViewingPartnerPhoto(null)}
                            >
                                <Ionicons name="close" size={28} color="#FFF" />
                            </Pressable>
                        </View>
                    </Pressable>
                </Modal>

                {/* Modal de perfil de pareja */}
                <Modal
                    visible={showPartnerProfile}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowPartnerProfile(false)}
                >
                    <Pressable
                        style={styles.partnerProfileOverlay}
                        onPress={() => setShowPartnerProfile(false)}
                    >
                        <Pressable
                            style={styles.partnerProfileContent}
                            onPress={(e) => e.stopPropagation()}
                        >
                            {/* Avatar grande */}
                            {partner?.avatar_url && (
                                <Pressable onPress={handleViewPartnerAvatar}>
                                    <Image
                                        source={{ uri: avatarService.getAvatarUrl(partner.avatar_url) || undefined }}
                                        style={styles.partnerProfileAvatar}
                                    />
                                </Pressable>
                            )}

                            {/* Nombre */}
                            <Text style={styles.partnerProfileName}>{partner?.name || 'Pareja'}</Text>

                            {/* Última conexión */}
                            <Text style={styles.partnerProfileLastSeen}>
                                {partner?.last_seen ? formatLastSeen(partner.last_seen) : 'Sin conexión'}
                            </Text>

                            {/* Fotos públicas */}
                            {partnerPhotos.length > 0 && (
                                <>
                                    <View style={styles.partnerPhotosHeader}>
                                        <Ionicons name="images" size={20} color="#667eea" />
                                        <Text style={styles.partnerPhotosTitle}>Fotos públicas</Text>
                                    </View>

                                    <View style={styles.partnerPhotosGrid}>
                                        {partnerPhotos.map((photo) => {
                                            const photoUrl = galleryService.getImageUrl(photo.image_path);
                                            return (
                                                <Pressable
                                                    key={photo.id}
                                                    onPress={() => handleViewPartnerPhoto(photoUrl)}
                                                >
                                                    <Image
                                                        source={{ uri: galleryService.getImageUrl(photo.thumbnail_path || photo.image_path) }}
                                                        style={styles.partnerPhotoItem}
                                                    />
                                                </Pressable>
                                            );
                                        })}
                                    </View>

                                    <Pressable
                                        style={styles.viewAllPhotosButton}
                                        onPress={() => {
                                            setShowPartnerProfile(false);
                                            router.push('/(app)/private-images');
                                        }}
                                    >
                                        <Text style={styles.viewAllPhotosText}>Ver todas las fotos</Text>
                                        <Ionicons name="arrow-forward" size={16} color="#667eea" />
                                    </Pressable>
                                </>
                            )}

                            {partnerPhotos.length === 0 && (
                                <View style={styles.noPhotosContainer}>
                                    <Ionicons name="images-outline" size={48} color="#CCC" />
                                    <Text style={styles.noPhotosText}>No hay fotos públicas</Text>
                                </View>
                            )}

                            {/* Botón cerrar */}
                            <Pressable
                                style={styles.closeProfileButton}
                                onPress={() => setShowPartnerProfile(false)}
                            >
                                <Ionicons name="close" size={24} color="#FFF" />
                            </Pressable>
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* Modal para configurar fondo del chat */}
                <Modal
                    visible={showBackgroundMenu}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowBackgroundMenu(false)}
                >
                    <View style={styles.backgroundMenuOverlay}>
                        <View style={styles.backgroundMenu}>
                            <Text style={styles.backgroundMenuTitle}>Fondo del Chat</Text>

                            <Pressable
                                style={styles.backgroundMenuItem}
                                onPress={handleSelectBackground}
                            >
                                <Ionicons name="image" size={24} color="#667eea" />
                                <Text style={styles.backgroundMenuItemText}>Seleccionar imagen</Text>
                            </Pressable>

                            {backgroundImage && (
                                <>
                                    <View style={styles.opacityControl}>
                                        <Text style={styles.opacityLabel}>
                                            Opacidad: {Math.round(backgroundOpacity * 100)}%
                                        </Text>
                                        <Slider
                                            style={styles.slider}
                                            minimumValue={0.2}
                                            maximumValue={0.8}
                                            value={backgroundOpacity}
                                            onValueChange={setBackgroundOpacity}
                                            minimumTrackTintColor="#667eea"
                                            maximumTrackTintColor="#E5E7EB"
                                        />
                                    </View>

                                    <Pressable
                                        style={[styles.backgroundMenuItem, styles.backgroundMenuItemDanger]}
                                        onPress={handleClearBackground}
                                    >
                                        <Ionicons name="trash" size={24} color="#EF4444" />
                                        <Text style={[styles.backgroundMenuItemText, styles.backgroundMenuItemTextDanger]}>
                                            Quitar fondo
                                        </Text>
                                    </Pressable>
                                </>
                            )}

                            <Pressable
                                style={styles.backgroundMenuClose}
                                onPress={() => setShowBackgroundMenu(false)}
                            >
                                <Text style={styles.backgroundMenuCloseText}>Cerrar</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F4F0F2',
    },
    backButton: {
        padding: 4,
        marginLeft: 0,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minWidth: 80,
        justifyContent: 'flex-end',
        marginLeft: 16,
    },
    headerButton: {
        padding: 4,
    },
    searchButton: {
        padding: 4,
        marginRight: 0,
    },
    closeButton: {
        padding: 4,
        marginRight: 0,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        maxWidth: '60%',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#181113',
        maxWidth: 150,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#EB477E',
        fontWeight: '500',
        maxWidth: 150,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#181113',
        backgroundColor: '#F8F6F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 12,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesScrollView: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#181113',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B7280',
    },
    messageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    replyIconContainer: {
        position: 'absolute',
        top: '50%',
        marginTop: -10,
        zIndex: 0,
    },
    replyIconLeft: {
        left: 10,
    },
    replyIconRight: {
        right: 10,
    },
    dateLabel: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        zIndex: 1,
    },
    messageRowMe: {
        flexDirection: 'row-reverse',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    messageBubble: {
        maxWidth: '70%',
        borderRadius: 20,
        padding: 12,
    },
    messageBubblePartner: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
    },
    messageBubbleMe: {
        backgroundColor: '#EB477E',
        borderBottomRightRadius: 4,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    messageEmoji: {
        fontSize: 16,
    },
    messageTime: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    messageTimeMe: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    messageText: {
        fontSize: 15,
        color: '#181113',
        lineHeight: 20,
    },
    messageTextMe: {
        color: '#FFF',
    },
    messageBubbleImage: {
        borderWidth: 2,
        borderColor: '#EB477E',
        borderStyle: 'dashed',
    },
    messageBubbleVoice: {
        minWidth: 200,
    },
    messageBubbleHighlighted: {
        borderWidth: 3,
        borderColor: '#667eea',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 12,
        transform: [{ scale: 1.02 }],
    },
    voiceSendingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        opacity: 0.7,
    },
    imageStatus: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    imageStatusMe: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    imageStatusUnread: {
        color: '#EB477E',
        fontWeight: '600',
    },
    inputContainerWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(244, 240, 242, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
    },
    replyPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    replyPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    replyPreviewBar: {
        width: 3,
        height: 40,
        backgroundColor: '#667eea',
        borderRadius: 2,
    },
    replyPreviewText: {
        flex: 1,
    },
    replyPreviewName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#667eea',
        marginBottom: 2,
    },
    replyPreviewMessage: {
        fontSize: 14,
        color: '#6B7280',
    },
    replyPreviewClose: {
        padding: 4,
    },
    quotedMessage: {
        flexDirection: 'row',
        marginBottom: 8,
        borderRadius: 8,
        padding: 8,
        gap: 8,
    },
    quotedMessagePartner: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    quotedMessageMe: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    quotedMessageBar: {
        width: 3,
        borderRadius: 2,
    },
    quotedMessageBarPartner: {
        backgroundColor: '#667eea',
    },
    quotedMessageBarMe: {
        backgroundColor: '#FFF',
    },
    quotedMessageContent: {
        flex: 1,
    },
    quotedMessageName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    quotedMessageNamePartner: {
        color: '#667eea',
    },
    quotedMessageNameMe: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    quotedMessageText: {
        fontSize: 13,
    },
    quotedMessageTextPartner: {
        color: '#6B7280',
    },
    quotedMessageTextMe: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        gap: 12,
    },
    keyboardView: {
        width: '100%',
    },
    imageButtonWrapper: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F6F6',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        minHeight: 40,
        position: 'relative',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#181113',
        maxHeight: 80,
        paddingVertical: 8,
        paddingRight: 50,
    },
    charCounter: {
        position: 'absolute',
        right: 14,
        bottom: 8,
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    sendButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    voiceButtonWrapper: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width,
        height: height,
    },
    captionOverlay: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 16,
        borderRadius: 12,
    },
    captionText: {
        color: '#FFF',
        fontSize: 16,
        textAlign: 'center',
    },
    closeImageButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeImageButtonText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '300',
    },
    warningOverlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 80,
        backgroundColor: 'rgba(255, 59, 48, 0.9)',
        padding: 12,
        borderRadius: 12,
    },
    warningText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    protectionOverlay: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    protectionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '500',
    },
    backgroundMenuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    backgroundMenu: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    backgroundMenuTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 20,
        textAlign: 'center',
    },
    backgroundMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    backgroundMenuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    backgroundMenuItemDanger: {
        backgroundColor: '#FEF2F2',
    },
    backgroundMenuItemTextDanger: {
        color: '#EF4444',
    },
    opacityControl: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    opacityLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    backgroundMenuClose: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    backgroundMenuCloseText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    partnerProfileOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    partnerProfileContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    partnerProfileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#667eea',
    },
    partnerProfileName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    partnerProfileLastSeen: {
        fontSize: 14,
        color: '#EB477E',
        fontWeight: '500',
        marginBottom: 24,
    },
    partnerPhotosHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    partnerPhotosTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    partnerPhotosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
        justifyContent: 'center',
    },
    partnerPhotoItem: {
        width: (width - 120) / 3,
        height: (width - 120) / 3,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    viewAllPhotosButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        marginTop: 8,
    },
    viewAllPhotosText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    noPhotosContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    noPhotosText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 12,
    },
    closeProfileButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoViewerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoViewerContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoViewerImage: {
        width: width,
        height: height,
    },
    photoViewerClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
