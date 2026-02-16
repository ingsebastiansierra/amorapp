import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Animated, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEmotionalStore } from '@/core/store/useEmotionalStore';
import { useAuthStore } from '@/core/store/useAuthStore';
import { EmotionalState, EMOTIONAL_STATES } from '@/core/types/emotions';
import { EmotionalStateSelector } from '@/shared/components/EmotionalStateSelector';
import { AnimatedEmoji } from '@/shared/components/AnimatedEmoji';
import { ImageAttachButton } from '@/shared/components/ImageAttachButton';
import { PrivateImagesBadge } from '@/shared/components/PrivateImagesBadge';
import { VoiceRecorderButton } from '@/shared/components/VoiceRecorderButton';
import { VoiceNotesBadge } from '@/shared/components/VoiceNotesBadge';
import { supabase } from '@/core/config/supabase';
import { avatarService } from '@/core/services/avatarService';

interface PartnerInfo {
    id: string;
    name: string;
    email: string;
    gender: string;
    birth_date: string;
}

export default function HomeScreen() {
    const { myState, partnerState, setMyState, startPolling, stopPolling } = useEmotionalStore();
    const { signOut, user } = useAuthStore();
    const router = useRouter();
    const [showStateSelector, setShowStateSelector] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [partner, setPartner] = useState<PartnerInfo | null>(null);
    const [myProfile, setMyProfile] = useState<{ name: string; gender: string; avatar_url: string | null } | null>(null);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const [isSynced, setIsSynced] = useState(false);
    const [receivedMessages, setReceivedMessages] = useState<Array<{ id: number; message: string; emotion: string; created_at: string }>>([]);
    const [showNotification, setShowNotification] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messagesSentForEmotion, setMessagesSentForEmotion] = useState(0);
    const [emotionBlocked, setEmotionBlocked] = useState(false);

    // Animaciones
    const heartScale = useRef(new Animated.Value(1)).current;
    const heartBeat = useRef<Animated.CompositeAnimation | null>(null);
    const profilePulse = useRef(new Animated.Value(1)).current;
    const menuSlide = useRef(new Animated.Value(300)).current;
    const pointerBounce = useRef(new Animated.Value(0)).current;
    const hintFade = useRef(new Animated.Value(0)).current;
    const hintAnimation = useRef<Animated.CompositeAnimation | null>(null);
    const emojiScale = useRef(new Animated.Value(1)).current;
    const emojiOpacity = useRef(new Animated.Value(1)).current;
    const partnerEmojiScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadPartnerInfo();
        loadMyProfile();
        loadMyCurrentState();
        startHeartBeat();
        startProfilePulse();
        // Carga inicial silenciosa (sin vibración ni modal)
        checkForNewMessages(true);

        return () => {
            stopPolling();
        };
    }, []);

    // Recargar perfil cuando la pantalla recibe focus (vuelves de otra pantalla)
    useFocusEffect(
        React.useCallback(() => {
            loadMyProfile();
        }, [])
    );

    // Animar cuando cambia mi estado emocional
    useEffect(() => {
        if (myState) {
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(emojiScale, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                    Animated.timing(emojiOpacity, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.spring(emojiScale, {
                        toValue: 1,
                        friction: 4,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                    Animated.timing(emojiOpacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        }
    }, [myState]);

    // Animar cuando cambia el estado de la pareja
    useEffect(() => {
        if (partnerState) {
            Animated.spring(partnerEmojiScale, {
                toValue: 1.2,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
            }).start(() => {
                Animated.spring(partnerEmojiScale, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [partnerState]);

    useEffect(() => {
        if (partner) {

            startPolling(partner.id);

            // Polling para mensajes cada 5 segundos (silencioso)
            const messageInterval = setInterval(() => {
                checkForNewMessages(true);
            }, 5000);

            return () => clearInterval(messageInterval);
        }
    }, [partner]);

    // Detectar sincronización de emociones
    useEffect(() => {
        // Solo sincronizado si AMBOS tienen estado Y son iguales Y hay pareja
        const synced = !!(partner && myState && partnerState && myState === partnerState);

        if (isSynced !== synced) {
            setIsSynced(synced);
            if (synced) {

                // Verificar si esta emoción está bloqueada
                checkEmotionLimit(myState);
                // Iniciar animación de hint solo si no está bloqueada
                if (!emotionBlocked) {
                    startHintAnimation();
                }
            } else {
                // Detener animación si ya no están sincronizados
                stopHintAnimation();
            }
        }
    }, [myState, partnerState, partner, isSynced]);

    useEffect(() => {
        if (showMenu) {
            Animated.spring(menuSlide, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
            }).start();
        } else {
            Animated.timing(menuSlide, {
                toValue: 300,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [showMenu]);

    const startHeartBeat = () => {
        heartBeat.current = Animated.loop(
            Animated.sequence([
                Animated.timing(heartScale, {
                    toValue: 1.1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(heartScale, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );
        heartBeat.current.start();
    };

    const startProfilePulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(profilePulse, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(profilePulse, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const startHintAnimation = () => {


        // Fade in del hint
        Animated.timing(hintFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Animación de rebote de la manita (hacia abajo)
        hintAnimation.current = Animated.loop(
            Animated.sequence([
                Animated.timing(pointerBounce, {
                    toValue: 10,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pointerBounce, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );
        hintAnimation.current.start();
    };

    const stopHintAnimation = () => {


        // Detener la animación de rebote
        if (hintAnimation.current) {
            hintAnimation.current.stop();
        }

        // Fade out del hint
        Animated.timing(hintFade, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Resetear posición
        pointerBounce.setValue(0);
    };

    const checkForNewMessages = async (silent: boolean = false) => {
        if (!user || !partner) {

            return;
        }

        try {


            // Obtener couple_id
            const { data: userData } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .single();

            if (!userData?.couple_id) {

                return;
            }



            // Buscar TODOS los mensajes no leídos
            const { data: messages, error } = await supabase
                .from('sync_messages')
                .select('*')
                .eq('couple_id', userData.couple_id)
                .eq('to_user_id', user.id)
                .eq('read', false)
                .order('created_at', { ascending: false });



            if (messages && messages.length > 0) {


                // Guardar todos los mensajes
                setReceivedMessages(messages.map(msg => ({
                    id: msg.id,
                    message: msg.message,
                    emotion: msg.synced_emotion,
                    created_at: msg.created_at
                })));

                const previousCount = unreadCount;
                setUnreadCount(messages.length);

                // Vibración solo si hay NUEVOS mensajes (no en carga inicial)
                if (!silent && previousCount < messages.length) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } else {
                setReceivedMessages([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('❌ Error checking messages:', error);
        }
    };

    const openMessageNotification = () => {


        if (receivedMessages.length > 0) {
            setShowNotification(true);
        } else {

        }
    };

    const closeNotificationWithoutReading = () => {
        // Solo cierra el modal, NO marca como leído ni limpia los mensajes

        setShowNotification(false);
        // Los mensajes y el badge permanecen
    };

    const markMessageAsRead = async (messageId: number) => {
        try {


            // Marcar como leído
            const { error } = await supabase
                .from('sync_messages')
                .update({ read: true })
                .eq('id', messageId);

            if (error) {
                console.error('❌ Error marking as read:', error);
                return;
            }



            // Remover el mensaje de la lista
            const updatedMessages = receivedMessages.filter(msg => msg.id !== messageId);
            setReceivedMessages(updatedMessages);
            setUnreadCount(updatedMessages.length);

            // Si no quedan mensajes, cerrar el modal
            if (updatedMessages.length === 0) {
                setShowNotification(false);
            }

            // Vibración de confirmación
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.error('❌ Error marking message as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {


            const messageIds = receivedMessages.map(msg => msg.id);

            // Marcar todos como leídos
            const { error } = await supabase
                .from('sync_messages')
                .update({ read: true })
                .in('id', messageIds);

            if (error) {
                console.error('❌ Error marking all as read:', error);
                return;
            }



            // Limpiar todo
            setReceivedMessages([]);
            setUnreadCount(0);
            setShowNotification(false);

            // Vibración de confirmación
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('❌ Error marking all as read:', error);
        }
    };

    const checkEmotionLimit = async (emotion: EmotionalState) => {
        if (!user || !partner) return;

        try {
            // Obtener couple_id
            const { data: userData } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .single();

            if (!userData?.couple_id) return;

            // Contar mensajes enviados en las últimas 6 horas para esta emoción
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

            const { data: messages, error } = await supabase
                .from('sync_messages')
                .select('*')
                .eq('couple_id', userData.couple_id)
                .eq('from_user_id', user.id)
                .eq('synced_emotion', emotion)
                .gte('created_at', sixHoursAgo);

            if (error) {
                console.error('Error checking emotion limit:', error);
                return;
            }

            const count = messages?.length || 0;


            setMessagesSentForEmotion(count);
            setEmotionBlocked(count >= 3);

            if (count >= 3) {

            }
        } catch (error) {
            console.error('Error checking emotion limit:', error);
        }
    };

    const loadMyProfile = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('users')
                .select('name, gender, avatar_url')
                .eq('id', user.id)
                .maybeSingle();

            if (data) {
                console.log('📸 Avatar URL loaded:', data.avatar_url);
                setMyProfile(data);
            }
        } catch (error) {
            console.error('Error loading my profile:', error);
        }
    };

    const loadMyCurrentState = async () => {
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

                // Actualizar el store con mi estado actual
                useEmotionalStore.setState({ myState: data.state as EmotionalState });
            }
        } catch (error) {
            console.error('Error loading my state:', error);
        }
    };

    const loadPartnerInfo = async () => {
        if (!user) return;

        try {
            // Obtener mi couple_id
            const { data: myData, error: myError } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!myData?.couple_id) return;

            // Obtener la pareja
            const { data: coupleData, error: coupleError } = await supabase
                .from('couples')
                .select('user1_id, user2_id')
                .eq('id', myData.couple_id)
                .maybeSingle();

            if (!coupleData) return;

            // Determinar el ID de la pareja
            const partnerId = coupleData.user1_id === user.id
                ? coupleData.user2_id
                : coupleData.user1_id;

            // Obtener info de la pareja
            const { data: partnerData, error: partnerError } = await supabase
                .from('users')
                .select('id, name, email, gender, birth_date')
                .eq('id', partnerId)
                .maybeSingle();

            if (partnerData) {
                setPartner(partnerData);
            }
        } catch (error) {
            console.error('Error loading partner:', error);
        }
    };

    const handleHeartPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Detener el latido
        if (heartBeat.current) {
            heartBeat.current.stop();
        }

        // Animación de presión
        Animated.sequence([
            Animated.timing(heartScale, {
                toValue: 1.3,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(heartScale, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Reiniciar latido
            startHeartBeat();
        });
    };

    const handleStateSelect = async (state: EmotionalState) => {
        await setMyState(state, 1);
        setShowStateSelector(false);
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const handleSendSyncMessage = async () => {
        if (!syncMessage.trim() || !partner || !user || !myState) {
            console.log('⚠️ Cannot send message:', {
                hasMessage: !!syncMessage.trim(),
                hasPartner: !!partner,
                hasUser: !!user,
                hasState: !!myState
            });
            return;
        }

        // Verificar si se alcanzó el límite
        if (emotionBlocked) {

            return;
        }

        try {


            // Obtener couple_id
            const { data: userData } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .single();

            if (!userData?.couple_id) {

                return;
            }


            console.log('📝 Message data:', {
                from: user.id,
                to: partner.id,
                message: syncMessage.trim(),
                emotion: myState
            });

            // Enviar mensaje
            const { data, error } = await supabase
                .from('sync_messages')
                .insert({
                    couple_id: userData.couple_id,
                    from_user_id: user.id,
                    to_user_id: partner.id,
                    message: syncMessage.trim(),
                    synced_emotion: myState,
                })
                .select();

            if (error) {
                console.error('❌ Error sending message:', error);
                throw error;
            }



            // Actualizar contador
            setMessagesSentForEmotion(messagesSentForEmotion + 1);
            if (messagesSentForEmotion + 1 >= 3) {
                setEmotionBlocked(true);
                stopHintAnimation();
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSyncMessage('');
            setShowSyncModal(false);
        } catch (error) {
            console.error('❌ Error sending sync message:', error);
        }
    };

    const myStateConfig = myState ? EMOTIONAL_STATES[myState] : null;
    const partnerStateConfig = partnerState ? EMOTIONAL_STATES[partnerState] : null;

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header simple */}
                <View style={styles.header}>
                    <Pressable onPress={() => setShowMenu(true)}>
                        {myProfile?.avatar_url ? (
                            <Image
                                key={myProfile.avatar_url}
                                source={{ uri: avatarService.getAvatarUrl(myProfile.avatar_url) || undefined }}
                                style={styles.headerAvatar}
                                onError={(error) => console.log('Error loading avatar:', error.nativeEvent.error)}
                            />
                        ) : (
                            <View style={styles.headerAvatarPlaceholder}>
                                <Ionicons name="heart" size={20} color="#EB477E" />
                            </View>
                        )}
                    </Pressable>
                    <Text style={styles.headerTitle}>US</Text>
                    <Pressable onPress={openMessageNotification} style={{ position: 'relative' }}>
                        <Ionicons name="notifications" size={26} color="#181113" />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Cards lado a lado */}
                    <View style={styles.cardsRow}>
                        {/* Card HIM/HER - Partner */}
                        <Pressable
                            style={[styles.moodCard, styles.cardBlue]}
                            onPress={() => partner && router.push({
                                pathname: '/(app)/partner-profile',
                                params: { partnerId: partner.id }
                            })}
                            disabled={!partner}
                        >
                            <Text style={styles.cardLabel}>
                                {partner?.gender === 'female' ? 'HER' : 'HIM'}
                            </Text>
                            <View style={styles.cardContent}>
                                {partner && partnerStateConfig ? (
                                    <Animated.View style={{ transform: [{ scale: partnerEmojiScale }] }}>
                                        <AnimatedEmoji
                                            emoji={partnerStateConfig.emoji}
                                            size={80}
                                            animate={true}
                                        />
                                    </Animated.View>
                                ) : (
                                    <Text style={styles.emojiLarge}>😶</Text>
                                )}
                                <Text style={styles.moodText}>
                                    {partner && partnerStateConfig ? partnerStateConfig.label : 'Sin estado'}
                                </Text>
                                <Text style={styles.timeText}>
                                    {partner && partnerStateConfig ? 'UPDATED 2M AGO' : ''}
                                </Text>
                            </View>
                        </Pressable>

                        {/* Card HIM/HER - Yo */}
                        <Pressable
                            style={[styles.moodCard, styles.cardPink]}
                            onPress={() => setShowStateSelector(true)}
                        >
                            <Text style={styles.cardLabel}>
                                {myProfile?.gender === 'female' ? 'HER' : 'HIM'}
                            </Text>
                            <View style={styles.cardContent}>
                                {myStateConfig ? (
                                    <Animated.View style={{
                                        transform: [{ scale: emojiScale }],
                                        opacity: emojiOpacity,
                                    }}>
                                        <AnimatedEmoji
                                            emoji={myStateConfig.emoji}
                                            size={80}
                                            animate={true}
                                        />
                                    </Animated.View>
                                ) : (
                                    <Text style={styles.emojiLarge}>😊</Text>
                                )}
                                <Text style={styles.moodText}>
                                    {myStateConfig ? myStateConfig.label : 'Tap to select'}
                                </Text>
                                <Text style={styles.timeText}>
                                    {myStateConfig ? 'UPDATED NOW' : ''}
                                </Text>
                            </View>
                        </Pressable>
                    </View>

                    {/* Botón IN SYNC flotante */}
                    {isSynced && partner && (
                        <View style={styles.syncButtonContainer}>
                            <Pressable
                                style={[styles.syncButton, emotionBlocked && styles.syncButtonDisabled]}
                                onPress={() => {
                                    if (!emotionBlocked) {
                                        setShowSyncModal(true);
                                    }
                                }}
                                disabled={emotionBlocked}
                            >
                                <Animated.View style={[styles.syncButtonInner, { transform: [{ scale: heartScale }] }]}>
                                    <Ionicons name="sync" size={16} color="#FFF" />
                                    <Text style={styles.syncText}>
                                        {emotionBlocked ? 'LIMIT REACHED' : 'IN SYNC'}
                                    </Text>
                                </Animated.View>
                            </Pressable>
                        </View>
                    )}

                    {/* Mensaje de sincronización */}
                    {isSynced && partner && (
                        <View style={styles.syncMessage}>
                            <Text style={styles.syncMessageText}>
                                You both are feeling the same way!
                            </Text>
                            <Text style={styles.syncStreak}>
                                Relationship streak: 12 days
                            </Text>
                        </View>
                    )}

                    {/* Botón Change My Mood */}
                    <Pressable
                        style={styles.changeMoodBtn}
                        onPress={() => setShowStateSelector(true)}
                    >
                        <Ionicons name="happy-outline" size={24} color="#FFF" />
                        <Text style={styles.changeMoodText}>Change My Mood</Text>
                    </Pressable>

                    {/* Upcoming Date Card */}
                    <Pressable style={styles.upcomingCard}>
                        <View style={styles.upcomingLeft}>
                            <View style={styles.upcomingIconBox}>
                                <Ionicons name="calendar-outline" size={22} color="#EB477E" />
                            </View>
                            <View>
                                <Text style={styles.upcomingTitle}>Upcoming Date</Text>
                                <Text style={styles.upcomingSubtitle}>Friday, 7:00 PM • Sushi Night</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
                    </Pressable>
                </ScrollView>

                {/* Modal de selector de estados */}
                <Modal
                    visible={showStateSelector}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowStateSelector(false)}
                >
                    <View style={styles.stateSelectorOverlay}>
                        <View style={[styles.stateSelectorContainer, { backgroundColor: '#EB477E' }]}>
                            <SafeAreaView style={styles.stateSelectorSafeArea}>
                                {/* Botón de cerrar */}
                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => setShowStateSelector(false)}
                                >
                                    <Text style={styles.closeIcon}>←</Text>
                                </Pressable>

                                <EmotionalStateSelector
                                    selectedState={myState}
                                    onSelectState={handleStateSelect}
                                />
                            </SafeAreaView>
                        </View>
                    </View>
                </Modal>

                {/* Modal de mensaje sincronizado */}
                <Modal
                    visible={showSyncModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowSyncModal(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <Pressable style={styles.syncModalOverlay} onPress={() => setShowSyncModal(false)}>
                            <Pressable style={styles.syncModalContainer} onPress={(e) => e.stopPropagation()}>
                                <View style={styles.syncModalHeader}>
                                    <Text style={styles.syncModalEmoji}>
                                        {myStateConfig?.emoji || '💕'}
                                    </Text>
                                    <Text style={styles.syncModalTitle}>¡Sincronizados!</Text>
                                    <Text style={styles.syncModalSubtitle}>
                                        {myStateConfig?.label}
                                    </Text>
                                </View>

                                <View style={styles.syncInputContainer}>
                                    <Text style={styles.syncInputLabel}>
                                        Mensaje ({syncMessage.length}/50)
                                    </Text>
                                    <TextInput
                                        style={styles.syncInput}
                                        placeholder="Escribe algo especial..."
                                        placeholderTextColor="#999"
                                        value={syncMessage}
                                        onChangeText={(text) => {
                                            if (text.length <= 50) {
                                                setSyncMessage(text);
                                            }
                                        }}
                                        maxLength={50}
                                        multiline
                                        numberOfLines={3}
                                        autoFocus
                                    />
                                    {partner && (
                                        <View style={styles.attachmentsRow}>
                                            <ImageAttachButton
                                                toUserId={partner.id}
                                                onSent={() => {
                                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                }}
                                                size={28}
                                                color="#007AFF"
                                            />
                                            <VoiceRecorderButton
                                                toUserId={partner.id}
                                                onSent={() => {
                                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                }}
                                                size={28}
                                                color="#FF3B30"
                                            />
                                        </View>
                                    )}
                                </View>

                                <Pressable
                                    style={[
                                        styles.syncSendButton,
                                        !syncMessage.trim() && styles.syncSendButtonDisabled
                                    ]}
                                    onPress={handleSendSyncMessage}
                                    disabled={!syncMessage.trim()}
                                >
                                    <Text style={styles.syncSendButtonText}>
                                        Enviar ✨
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={styles.syncCancelButton}
                                    onPress={() => {
                                        setShowSyncModal(false);
                                        setSyncMessage('');
                                    }}
                                >
                                    <Text style={styles.syncCancelButtonText}>Cancelar</Text>
                                </Pressable>
                            </Pressable>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Modal>

                {/* Modal de menú con animación mejorada */}
                <Modal
                    visible={showMenu}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowMenu(false)}
                >
                    <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
                        <Animated.View
                            style={[
                                styles.menuContainer,
                                { transform: [{ translateY: menuSlide }] }
                            ]}
                        >
                            <View style={styles.menuHeader}>
                                <Text style={styles.menuTitle}>Mi Perfil</Text>
                                <Text style={styles.menuEmail}>{user?.email || 'Usuario'}</Text>
                            </View>

                            <Pressable style={styles.menuItem} onPress={() => {
                                setShowMenu(false);
                                router.push('/(app)/profile');
                            }}>
                                <Ionicons name="person-circle-outline" size={28} color="#667eea" style={{ marginRight: 12 }} />
                                <Text style={styles.menuItemText}>Ver Perfil Completo</Text>
                            </Pressable>

                            <Pressable style={styles.menuItem} onPress={() => setShowMenu(false)}>
                                <Ionicons name="settings-outline" size={28} color="#667eea" style={{ marginRight: 12 }} />
                                <Text style={styles.menuItemText}>Configuración</Text>
                            </Pressable>

                            <Pressable style={styles.menuItem} onPress={() => {
                                setShowMenu(false);
                                router.push('/(app)/link-partner');
                            }}>
                                <Ionicons name="heart-circle-outline" size={28} color="#667eea" style={{ marginRight: 12 }} />
                                <Text style={styles.menuItemText}>Vincular Pareja</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.menuItem, styles.menuItemDanger]}
                                onPress={() => {
                                    setShowMenu(false);
                                    handleSignOut();
                                }}
                            >
                                <Ionicons name="log-out-outline" size={28} color="#E53E3E" style={{ marginRight: 12 }} />
                                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                                    Cerrar Sesión
                                </Text>
                            </Pressable>

                            <Pressable style={styles.menuClose} onPress={() => setShowMenu(false)}>
                                <Text style={styles.menuCloseText}>Cancelar</Text>
                            </Pressable>
                        </Animated.View>
                    </Pressable>
                </Modal>

                {/* Modal de notificación de mensajes recibidos */}
                <Modal
                    visible={showNotification}
                    transparent
                    animationType="fade"
                    onRequestClose={closeNotificationWithoutReading}
                >
                    <Pressable style={styles.messageModalOverlay} onPress={closeNotificationWithoutReading}>
                        <Pressable style={styles.messageModalContainer} onPress={(e) => e.stopPropagation()}>
                            <View style={styles.messageModalHeader}>
                                <Text style={styles.messageModalTitle}>
                                    💌 Mensajes de {partner?.name || 'tu pareja'}
                                </Text>
                                <Text style={styles.messageModalSubtitle}>
                                    {unreadCount} {unreadCount === 1 ? 'mensaje' : 'mensajes'} sin leer
                                </Text>
                            </View>

                            <ScrollView style={styles.messagesList}>
                                {receivedMessages.map((msg, index) => (
                                    <View key={msg.id} style={styles.messageItem}>
                                        <View style={styles.messageItemHeader}>
                                            <Text style={styles.messageItemEmoji}>
                                                {EMOTIONAL_STATES[msg.emotion as EmotionalState]?.emoji || '💕'}
                                            </Text>
                                            <Text style={styles.messageItemEmotion}>
                                                {EMOTIONAL_STATES[msg.emotion as EmotionalState]?.label}
                                            </Text>
                                        </View>
                                        <View style={styles.messageItemBubble}>
                                            <Text style={styles.messageItemText}>
                                                "{msg.message}"
                                            </Text>
                                        </View>
                                        <Pressable
                                            style={styles.messageItemButton}
                                            onPress={() => markMessageAsRead(msg.id)}
                                        >
                                            <Text style={styles.messageItemButtonText}>
                                                ✓ Marcar como leído
                                            </Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </ScrollView>

                            <View style={styles.messageModalActions}>
                                <Pressable
                                    style={styles.messageModalButton}
                                    onPress={markAllAsRead}
                                >
                                    <Text style={styles.messageModalButtonText}>
                                        Marcar todos como leídos
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={styles.messageModalCancelButton}
                                    onPress={closeNotificationWithoutReading}
                                >
                                    <Text style={styles.messageModalCancelButtonText}>
                                        Cerrar
                                    </Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6F6',
    },
    safeArea: {
        flex: 1,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: '#FFF',
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    headerAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: '#181113',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EB477E',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Content
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
    },
    // Cards Row
    cardsRow: {
        flexDirection: 'row',
        gap: 12,
        height: 400,
        marginTop: 16,
        marginBottom: -30,
    },
    moodCard: {
        flex: 1,
        borderRadius: 32,
        padding: 20,
        position: 'relative',
    },
    cardBlue: {
        backgroundColor: '#E0F2FF',
    },
    cardPink: {
        backgroundColor: '#FCE7F3',
        borderWidth: 1,
        borderColor: 'rgba(235, 71, 126, 0.2)',
    },
    cardLabel: {
        position: 'absolute',
        top: 16,
        left: 16,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#6B7280',
        opacity: 0.6,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiLarge: {
        fontSize: 80,
    },
    moodText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    timeText: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    // Sync Button
    syncButtonContainer: {
        alignItems: 'center',
        marginTop: -20,
        marginBottom: 24,
        zIndex: 10,
    },
    syncButton: {
        backgroundColor: '#EB477E',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#EB477E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    syncButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    syncButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    syncIcon: {
        fontSize: 14,
    },
    syncText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    // Sync Message
    syncMessage: {
        alignItems: 'center',
        marginBottom: 24,
    },
    syncMessageText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    syncStreak: {
        fontSize: 14,
        color: '#EB477E',
        fontWeight: '600',
    },
    // Change Mood Button
    changeMoodBtn: {
        backgroundColor: '#EB477E',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 24,
        marginBottom: 16,
        shadowColor: '#EB477E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    changeMoodIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    changeMoodText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
    // Upcoming Card
    upcomingCard: {
        backgroundColor: '#F8F6F6',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    upcomingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    upcomingIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    upcomingIcon: {
        fontSize: 20,
    },
    upcomingTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#181113',
    },
    upcomingSubtitle: {
        fontSize: 10,
        color: '#6B7280',
    },
    chevron: {
        fontSize: 24,
        color: '#D1D5DB',
    },
    // Bottom Navigation
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: '#F4F0F2',
        paddingBottom: 20,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    navItemCenter: {
        flex: 1,
        alignItems: 'center',
        marginTop: -24,
    },
    navLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 4,
    },
    navLabelActive: {
        color: '#EB477E',
        fontWeight: '700',
    },
    navBadge: {
        position: 'absolute',
        top: 4,
        right: '30%',
        backgroundColor: '#EB477E',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    navCenterBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EB477E',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EB477E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    // Header Bar
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    headerProfileButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerProfileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    headerProfileIcon: {
        fontSize: 24,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerNotificationButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerNotificationIcon: {
        fontSize: 24,
    },
    headerNotificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#E53E3E',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    headerNotificationBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    // Sección de la pareja
    partnerSection: {
        flex: 2,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    partnerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    partnerCardHeader: {
        marginBottom: 16,
    },
    partnerCardLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFF',
        opacity: 0.85,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
    partnerCardContent: {
        alignItems: 'center',
    },
    partnerName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    emotionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        padding: 20,
        minWidth: 140,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    emotionLabel: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFF',
        textAlign: 'center',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    noEmotionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        minWidth: 140,
    },
    noEmotionEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    noEmotionText: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
        textAlign: 'center',
        fontWeight: '500',
    },
    // Centro - Conexión
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    syncedWrapper: {
        alignItems: 'center',
        position: 'relative',
    },
    heartContainer: {
        alignItems: 'center',
    },
    connectionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    connectionEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    connectionText: {
        fontSize: 15,
        color: '#FFF',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // Sincronización
    syncedContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 24,
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    syncedContainerBlocked: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        opacity: 0.7,
    },
    syncedEmoji: {
        fontSize: 36,
        marginBottom: 6,
    },
    syncedText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    syncedBlockedText: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.9,
        marginTop: 4,
        textAlign: 'center',
    },
    syncedCountText: {
        fontSize: 11,
        color: '#FFF',
        opacity: 0.8,
        marginTop: 4,
    },
    // Hint animado
    hintContainer: {
        position: 'absolute',
        bottom: -75,
        alignItems: 'center',
        zIndex: 100,
    },
    hintPointer: {
        fontSize: 36,
        marginBottom: 4,
    },
    hintBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    hintText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#667eea',
    },
    // Sección mía
    mySection: {
        flex: 2,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    mySectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFF',
        opacity: 0.85,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 16,
    },
    myEmotionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    myEmotionLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    selectEmotionContainer: {
        alignItems: 'center',
    },
    selectEmotionEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    selectEmotionText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
        opacity: 0.95,
    },
    // Barra de acciones rápidas
    quickActionsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        paddingBottom: 20,
        gap: 16,
    },
    quickActionButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    quickActionIcon: {
        fontSize: 32,
        marginBottom: 6,
    },
    quickActionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFF',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // Modal de notificación de mensaje
    messageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    messageModalContainer: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    messageModalHeader: {
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    messageModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A202C',
        textAlign: 'center',
        marginBottom: 4,
    },
    messageModalSubtitle: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
    },
    messagesList: {
        maxHeight: 400,
        marginBottom: 16,
    },
    messageItem: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
    },
    messageItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    messageItemEmoji: {
        fontSize: 24,
        marginRight: 8,
    },
    messageItemEmotion: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    messageItemBubble: {
        marginBottom: 12,
    },
    messageItemText: {
        fontSize: 16,
        color: '#1A202C',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    messageItemButton: {
        backgroundColor: '#E6FFFA',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    messageItemButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#38B2AC',
    },
    messageModalActions: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 16,
    },
    messageModalButton: {
        backgroundColor: '#667eea',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    messageModalButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    messageModalCancelButton: {
        padding: 12,
        alignItems: 'center',
    },
    messageModalCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#718096',
    },
    // Modal de mensaje sincronizado
    keyboardView: {
        flex: 1,
    },
    syncModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    syncModalContainer: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        paddingBottom: 32,
        maxHeight: '80%',
        width: '100%',
    },
    syncModalHeader: {
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    syncModalEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    syncModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A202C',
        marginBottom: 2,
    },
    syncModalSubtitle: {
        fontSize: 14,
        color: '#718096',
    },
    syncInputContainer: {
        marginBottom: 16,
    },
    syncInputLabel: {
        fontSize: 13,
        color: '#718096',
        marginBottom: 8,
        fontWeight: '600',
    },
    syncInput: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1A202C',
        minHeight: 80,
        maxHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    attachmentsRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    syncSendButton: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    syncSendButtonDisabled: {
        opacity: 0.5,
    },
    syncSendButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    syncCancelButton: {
        padding: 10,
        alignItems: 'center',
    },
    syncCancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#718096',
    },
    // Modal de selector de estados
    stateSelectorOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    stateSelectorContainer: {
        flex: 1,
    },
    stateSelectorSafeArea: {
        flex: 1,
        paddingTop: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        left: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeIcon: {
        fontSize: 28,
        color: '#FFF',
        fontWeight: 'bold',
    },
    // Modal de menú
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    menuContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    menuHeader: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    menuTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A202C',
        marginBottom: 4,
    },
    menuEmail: {
        fontSize: 14,
        color: '#718096',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F7FAFC',
        marginBottom: 12,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A202C',
    },
    menuItemDanger: {
        backgroundColor: '#FFF5F5',
    },
    menuItemTextDanger: {
        color: '#E53E3E',
    },
    menuClose: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    menuCloseText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#718096',
    },
});
