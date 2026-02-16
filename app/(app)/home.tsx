import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Animated, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
    const [myProfile, setMyProfile] = useState<{ name: string; gender: string } | null>(null);
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
                .select('name, gender')
                .eq('id', user.id)
                .maybeSingle();

            if (data) {
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
        <LinearGradient
            colors={myStateConfig?.gradient || ['#667eea', '#764ba2']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header - Pareja */}
                <View style={styles.partnerSection}>
                    <Pressable
                        onPress={() => partner && router.push({
                            pathname: '/(app)/partner-profile',
                            params: { partnerId: partner.id }
                        })}
                        disabled={!partner}
                        style={styles.partnerCard}
                    >
                        <Text style={styles.sectionLabel}>Tu pareja</Text>
                        <View style={styles.emotionDisplay}>
                            <Text style={styles.partnerName}>
                                {partner
                                    ? `${partner.gender === 'female' ? '👩' : '👨'} ${partner.name}`
                                    : '💕 Sin pareja vinculada'}
                            </Text>
                            {partner && partnerStateConfig ? (
                                <Animated.View style={[
                                    styles.emotionCard,
                                    { transform: [{ scale: partnerEmojiScale }] }
                                ]}>
                                    <AnimatedEmoji
                                        emoji={partnerStateConfig.emoji}
                                        size={48}
                                        animate={true}
                                    />
                                    <Text style={styles.emotionLabel}>{partnerStateConfig.label}</Text>
                                </Animated.View>
                            ) : partner ? (
                                <Text style={styles.noEmotionText}>Sin estado emocional</Text>
                            ) : (
                                <Text style={styles.noEmotionText}>Vincula a tu pareja para comenzar</Text>
                            )}
                        </View>
                    </Pressable>
                </View>

                {/* Centro - Conexión */}
                <View style={styles.centerSection}>
                    {isSynced && partner ? (
                        // Animación de sincronización
                        <View style={styles.syncedWrapper}>
                            <Pressable
                                onPress={() => {
                                    if (!emotionBlocked) {
                                        setShowSyncModal(true);
                                        stopHintAnimation();
                                    }
                                }}
                                disabled={emotionBlocked}
                            >
                                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                                    <View style={[
                                        styles.syncedContainer,
                                        emotionBlocked && styles.syncedContainerBlocked
                                    ]}>
                                        <Text style={styles.syncedEmoji}>
                                            {emotionBlocked ? '🔒' : '✨💕✨'}
                                        </Text>
                                        <Text style={styles.syncedText}>
                                            {emotionBlocked ? 'Límite alcanzado' : '¡Sincronizados!'}
                                        </Text>
                                        {emotionBlocked && (
                                            <Text style={styles.syncedBlockedText}>
                                                Cambia de emoción para continuar
                                            </Text>
                                        )}
                                        {!emotionBlocked && messagesSentForEmotion > 0 && (
                                            <Text style={styles.syncedCountText}>
                                                {messagesSentForEmotion}/3 mensajes enviados
                                            </Text>
                                        )}
                                    </View>
                                </Animated.View>
                            </Pressable>

                            {/* Hint animado - solo si no está bloqueado */}
                            {!emotionBlocked && (
                                <Animated.View
                                    style={[
                                        styles.hintContainer,
                                        {
                                            opacity: hintFade,
                                            transform: [{ translateY: pointerBounce }]
                                        }
                                    ]}
                                >
                                    <Text style={styles.hintPointer}>👆</Text>
                                    <View style={styles.hintBubble}>
                                        <Text style={styles.hintText}>¡Dale click!</Text>
                                    </View>
                                </Animated.View>
                            )}
                        </View>
                    ) : (
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Pressable onPress={handleHeartPress} style={styles.heartContainer}>
                                <Text style={styles.connectionEmoji}>💕</Text>
                                <Text style={styles.connectionText}>
                                    {partner ? 'Conectados' : 'Esperando conexión'}
                                </Text>
                            </Pressable>
                        </Animated.View>
                    )}
                </View>

                {/* Footer - Mi estado */}
                <View style={styles.mySection}>
                    {myProfile && (
                        <View style={styles.myNameContainer}>
                            <Text style={styles.myNameEmoji}>
                                {myProfile.gender === 'female' ? '👩' : '👨'}
                            </Text>
                            <Text style={styles.myName}>
                                {myProfile.name.split(' ')[0]}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.sectionLabel}>¿Cómo te sientes?</Text>
                    <Pressable onPress={() => setShowStateSelector(true)} style={styles.myEmotionCard}>
                        {myStateConfig ? (
                            <Animated.View style={{
                                transform: [{ scale: emojiScale }],
                                opacity: emojiOpacity,
                                alignItems: 'center',
                            }}>
                                <AnimatedEmoji
                                    emoji={myStateConfig.emoji}
                                    size={56}
                                    animate={true}
                                />
                                <Text style={styles.myEmotionLabel}>{myStateConfig.label}</Text>
                            </Animated.View>
                        ) : (
                            <Text style={styles.selectEmotionText}>Toca para seleccionar</Text>
                        )}
                    </Pressable>
                </View>

                {/* Modal de selector de estados */}
                <Modal
                    visible={showStateSelector}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowStateSelector(false)}
                >
                    <View style={styles.stateSelectorOverlay}>
                        <LinearGradient
                            colors={myStateConfig?.gradient || ['#667eea', '#764ba2']}
                            style={styles.stateSelectorContainer}
                        >
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
                        </LinearGradient>
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
                                <Text style={styles.menuItemIcon}>👤</Text>
                                <Text style={styles.menuItemText}>Ver Perfil Completo</Text>
                            </Pressable>

                            <Pressable style={styles.menuItem} onPress={() => setShowMenu(false)}>
                                <Text style={styles.menuItemIcon}>⚙️</Text>
                                <Text style={styles.menuItemText}>Configuración</Text>
                            </Pressable>

                            <Pressable style={styles.menuItem} onPress={() => {
                                setShowMenu(false);
                                router.push('/(app)/link-partner');
                            }}>
                                <Text style={styles.menuItemIcon}>💑</Text>
                                <Text style={styles.menuItemText}>Vincular Pareja</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.menuItem, styles.menuItemDanger]}
                                onPress={() => {
                                    setShowMenu(false);
                                    handleSignOut();
                                }}
                            >
                                <Text style={styles.menuItemIcon}>🚪</Text>
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

                {/* Botón de notificación flotante */}
                <Animated.View style={styles.notificationButtonContainer}>
                    <Pressable
                        style={styles.notificationButton}
                        onPress={openMessageNotification}
                    >
                        <Text style={styles.notificationIcon}>💌</Text>
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </Pressable>
                </Animated.View>

                {/* Botón de imágenes privadas flotante */}
                <Animated.View style={styles.imagesButtonContainer}>
                    <Pressable
                        style={styles.imagesButton}
                        onPress={() => router.push('/(app)/private-images')}
                    >
                        <Text style={styles.imagesIcon}>📸</Text>
                        <PrivateImagesBadge />
                    </Pressable>
                </Animated.View>

                {/* Botón de notas de voz flotante */}
                <Animated.View style={styles.voiceButtonContainer}>
                    <Pressable
                        style={styles.voiceButton}
                        onPress={() => router.push('/(app)/voice-notes')}
                    >
                        <Text style={styles.voiceIcon}>🎤</Text>
                        <VoiceNotesBadge />
                    </Pressable>
                </Animated.View>

                {/* Botón de perfil flotante con pulso */}
                <Animated.View style={[styles.profileButtonContainer, { transform: [{ scale: profilePulse }] }]}>
                    <Pressable style={styles.profileButton} onPress={() => setShowMenu(true)}>
                        <Text style={styles.profileIcon}>👤</Text>
                    </Pressable>
                </Animated.View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
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
    profileButtonContainer: {
        position: 'absolute',
        bottom: 160,
        right: 20,
        zIndex: 10,
    },
    profileButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    profileIcon: {
        fontSize: 28,
    },
    // Botón de notificación flotante
    notificationButtonContainer: {
        position: 'absolute',
        bottom: 160,
        left: 20,
        zIndex: 10,
    },
    notificationButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    notificationIcon: {
        fontSize: 28,
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#E53E3E',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    notificationBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Botón de imágenes privadas flotante
    imagesButtonContainer: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        zIndex: 10,
    },
    imagesButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF6B9D',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    imagesIcon: {
        fontSize: 28,
    },
    // Botón de notas de voz flotante
    voiceButtonContainer: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        zIndex: 10,
    },
    voiceButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    voiceIcon: {
        fontSize: 28,
    },
    sectionLabel: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
        marginBottom: 12,
        textAlign: 'center',
        fontWeight: '600',
    },
    // Sección de la pareja (arriba)
    partnerSection: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 80,
    },
    partnerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    emotionDisplay: {
        alignItems: 'center',
    },
    partnerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    emotionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        minWidth: 120,
        alignItems: 'center',
    },
    emotionEmoji: {
        fontSize: 48,
        marginBottom: 6,
    },
    emotionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        textAlign: 'center',
    },
    noEmotionText: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Centro - Conexión
    centerSection: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    syncedWrapper: {
        alignItems: 'center',
        position: 'relative',
    },
    heartContainer: {
        alignItems: 'center',
    },
    connectionEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    connectionText: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.8,
        fontWeight: '600',
    },
    // Sincronización
    syncedContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    syncedContainerBlocked: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        opacity: 0.7,
    },
    syncedEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    syncedText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    syncedBlockedText: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.8,
        marginTop: 4,
        textAlign: 'center',
    },
    syncedCountText: {
        fontSize: 11,
        color: '#FFF',
        opacity: 0.7,
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
        paddingHorizontal: 14,
        paddingVertical: 8,
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
    // Sección mía (abajo)
    mySection: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 40,
    },
    myNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    myNameEmoji: {
        fontSize: 24,
        marginRight: 8,
    },
    myName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFF',
    },
    myEmotionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    myEmotionEmoji: {
        fontSize: 56,
        marginBottom: 8,
    },
    myEmotionLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
    selectEmotionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        opacity: 0.9,
    },
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
    menuItemIcon: {
        fontSize: 24,
        marginRight: 12,
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
