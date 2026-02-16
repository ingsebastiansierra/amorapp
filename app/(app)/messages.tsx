import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform, Modal, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ScreenCapture from 'expo-screen-capture';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { EMOTIONAL_STATES } from '@/core/types/emotions';
import { EmotionalState } from '@/core/types/emotions';
import { avatarService } from '@/core/services/avatarService';
import { ImageAttachButton } from '@/shared/components/ImageAttachButton';
import { mediaService } from '@/core/services/mediaService';

const { width, height } = Dimensions.get('window');

interface Message {
    id: string;
    message: string;
    synced_emotion: string;
    created_at: string;
    from_user_id: string;
    read: boolean;
    type?: 'text' | 'image';
    image_id?: string;
    image_expired?: boolean;
}

interface PartnerInfo {
    id: string;
    name: string;
    avatar_url: string | null;
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

    useEffect(() => {
        loadMyProfile();
        loadPartnerInfo();
        loadMyCurrentEmotion();

        // Polling para actualizar la emoción cada 3 segundos
        const emotionInterval = setInterval(loadMyCurrentEmotion, 3000);
        return () => clearInterval(emotionInterval);
    }, []);

    useEffect(() => {
        if (user) {
            loadMessages();
            // Polling cada 3 segundos
            const interval = setInterval(loadMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [user, partner]);

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
                .select('id, name, avatar_url')
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

            // Combinar mensajes e imágenes
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

            // Combinar y ordenar por fecha
            const allMessages = [...textMessages, ...imageMessages].sort(
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
        if (!newMessage.trim() || !partner || !user || !myCurrentEmotion) {
            return;
        }

        try {
            const { data: userData } = await supabase
                .from('users')
                .select('couple_id')
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
                    synced_emotion: myCurrentEmotion,
                });

            if (error) {
                return;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

    const renderMessage = (msg: Message) => {
        const isFromMe = msg.from_user_id === user?.id;
        const emotionConfig = EMOTIONAL_STATES[msg.synced_emotion as EmotionalState];
        const isImage = msg.type === 'image';

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
                    isFromMe ? styles.messageBubbleMe : styles.messageBubblePartner,
                    isImage && styles.messageBubbleImage
                ]}>
                    <View style={styles.messageHeader}>
                        <Text style={styles.messageEmoji}>
                            {isImage ? '📷' : (emotionConfig?.emoji || '💕')}
                        </Text>
                        <Text style={[styles.messageTime, isFromMe && styles.messageTimeMe]}>
                            {formatTime(msg.created_at)}
                        </Text>
                    </View>

                    {isImage ? (
                        <View>
                            <Text style={[styles.messageText, isFromMe && styles.messageTextMe]}>
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
                        <Text style={[styles.messageText, isFromMe && styles.messageTextMe]}>
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
                                <Text style={styles.headerSubtitle}>Desde Junio 12, 2021</Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={() => setShowSearch(true)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.searchButton}
                        >
                            <Ionicons name="search" size={24} color="#181113" />
                        </Pressable>
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
            <ScrollView
                ref={scrollViewRef}
                style={[styles.messagesContainer, { backgroundColor }]}
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

            {/* Input de mensaje */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.inputContainer}>
                    {partner && (
                        <View style={styles.imageButtonWrapper}>
                            <ImageAttachButton
                                toUserId={partner.id}
                                onSent={() => {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                }}
                                size={28}
                                color="#EB477E"
                            />
                        </View>
                    )}

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Comparte un pensamiento..."
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

                    <Pressable
                        style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!newMessage.trim()}
                    >
                        <Ionicons name="send" size={24} color={newMessage.trim() ? "#EB477E" : "#D1D5DB"} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>

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
        paddingVertical: 8,
        paddingBottom: 8,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F4F0F2',
        gap: 12,
    },
    imageButtonWrapper: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F6F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 48,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#181113',
        maxHeight: 100,
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
});
