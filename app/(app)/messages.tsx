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
            // Polling cada 3 segundos
            const interval = setInterval(loadMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [user, partner]);

    // Polling para actualizar info de la pareja (incluyendo last_seen)
    useEffect(() => {
        if (partner) {
            const partnerInterval = setInterval(loadPartnerInfo, 5000); // Cada 5 segundos
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

            // Scroll al final después de cargar mensajes
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 100);

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

        // Si no hay emoción actual, usar 'normal' como predeterminada
        const emotionToUse: EmotionalState = myCurrentEmotion || EmotionalState.NORMAL;

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('couple_id, name')
                .eq('id', user.id)
                .maybeSingle();

            if (!userData?.couple_id) {
                return;
            }

            const { error } = await supabase
                .from('sync_messages')
                .insert({
                    couple_id: userData.couple_id,
                    from_user_id: user.id,
                    to_user_id: partner.id,
                    message: newMessage.trim(),
                    synced_emotion: emotionToUse,
                });

            if (error) {
                return;
            }

            // Enviar notificación push a la pareja
            if (partner.push_token && userData.name) {
                await notificationService.sendMessageNotification(
                    partner.push_token,
                    userData.name,
                    newMessage.trim(),
                    emotionToUse
                );
            }

            // Reproducir sonido y haptic feedback
            await playSendSound();
            setNewMessage('');
            loadMessages(); // Recargar mensajes inmediatamente
        } catch (error) {
            // Error sending message
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
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

    const renderMessage = (msg: Message) => {
        const isFromMe = msg.from_user_id === user?.id;
        const emotionConfig = EMOTIONAL_STATES[msg.synced_emotion as EmotionalState];
        const isImage = msg.type === 'image';
        const isVoice = msg.type === 'voice';

        return (
            <Pressable
                key={msg.id}
                style={[styles.messageRow, isFromMe && styles.messageRowMe]}
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

                <View style={[
                    styles.messageBubble,
                    isFromMe ? [styles.messageBubbleMe, { backgroundColor: themeColors.sentBackground }] : [styles.messageBubblePartner, { backgroundColor: themeColors.receivedBackground }],
                    isImage && styles.messageBubbleImage,
                    isVoice && styles.messageBubbleVoice
                ]}>
                    <View style={styles.messageHeader}>
                        <Text style={styles.messageEmoji}>
                            {isImage ? '📷' : isVoice ? '🎤' : (emotionConfig?.emoji || '💕')}
                        </Text>
                        <Text style={[styles.messageTime, isFromMe && styles.messageTimeMe]}>
                            {formatTime(msg.created_at)}
                        </Text>
                    </View>

                    {isVoice && msg.voice_id && msg.voice_storage_path && msg.voice_duration ? (
                        <VoiceMessagePlayer
                            voiceId={msg.voice_id}
                            storagePath={msg.voice_storage_path}
                            duration={msg.voice_duration}
                            waveform={msg.voice_waveform}
                            isFromMe={isFromMe}
                            onListened={() => {
                                // Recargar mensajes después de escuchar
                                loadMessages();
                            }}
                        />
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
                                    <Image
                                        source={{ uri: avatarService.getAvatarUrl(partner.avatar_url) || undefined }}
                                        style={styles.headerAvatar}
                                    />
                                )}
                                <View>
                                    <Text style={styles.headerTitle}>{partner?.name || 'Pareja'}</Text>
                                    <Text style={styles.headerSubtitle}>
                                        {partner?.last_seen ? formatLastSeen(partner.last_seen) : 'Sin conexión'}
                                    </Text>
                                </View>
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
                            maxLength={200}
                        />
                        <Pressable style={styles.emojiButton}>
                            <Ionicons name="happy-outline" size={24} color="#9CA3AF" />
                        </Pressable>
                    </View>

                    {/* Mostrar botón de voz cuando no hay texto, botón de enviar cuando hay texto */}
                    {!newMessage.trim() && partner ? (
                        <View style={styles.voiceButtonWrapper}>
                            <VoiceRecorderButton
                                toUserId={partner.id}
                                onSent={() => {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F4F0F2',
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerButton: {
        padding: 4,
    },
    searchButton: {
        padding: 4,
        marginRight: -4,
    },
    closeButton: {
        padding: 4,
        marginRight: -4,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#EB477E',
        fontWeight: '500',
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
    dateLabel: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
        gap: 8,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(244, 240, 242, 0.5)',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
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
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#181113',
        maxHeight: 80,
    },
    emojiButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
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
});
