import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/core/store/useThemeStore';
import { useChatBackgroundStore, MessageColorTheme, EmojiStyle } from '@/core/store/useChatBackgroundStore';
import { THEMES, FREE_THEMES, PREMIUM_THEMES } from '@/core/config/themes';
import { ThemeType } from '@/core/types/theme';
import { useSmartRewardedAd } from '@/shared/hooks/useSmartRewardedAd';
import * as Haptics from 'expo-haptics';

const COLOR_THEMES = [
    {
        id: 'classic-pink' as MessageColorTheme,
        name: 'Classic Pink',
        color: '#E91E63',
    },
    {
        id: 'ocean-blue' as MessageColorTheme,
        name: 'Ocean Blue',
        color: '#2196F3',
    },
    {
        id: 'midnight-purple' as MessageColorTheme,
        name: 'Midnight Purple',
        color: '#6A1B9A',
    },
    {
        id: 'soft-green' as MessageColorTheme,
        name: 'Soft Green',
        color: '#388E3C',
    },
];

const EMOJI_STYLES = [
    {
        id: 'modern' as EmojiStyle,
        name: 'Moderno',
        description: 'Brillante y detallado',
        icon: '✨',
    },
    {
        id: 'classic' as EmojiStyle,
        name: 'Clásico',
        description: 'Estilo estándar del sistema',
        icon: '😊',
    },
    {
        id: 'minimal' as EmojiStyle,
        name: 'Minimalista',
        description: 'Arte lineal y sobrio',
        icon: '🤍',
    },
];

export default function ThemeSettingsScreen() {
    const router = useRouter();
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setTheme = useThemeStore(state => state.setTheme);
    const isPremium = useThemeStore(state => state.isPremium);
    const unlockedThemes = useThemeStore(state => state.unlockedThemes);
    const unlockThemeTemporarily = useThemeStore(state => state.unlockThemeTemporarily);
    const getTimeRemaining = useThemeStore(state => state.getTimeRemaining);
    const isThemeUnlocked = useThemeStore(state => state.isThemeUnlocked);
    const { messageColorTheme, emojiStyle, setMessageColorTheme, setEmojiStyle } = useChatBackgroundStore();
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedPremiumTheme, setSelectedPremiumTheme] = useState<ThemeType | null>(null);
    const [timeRemainingMap, setTimeRemainingMap] = useState<Record<string, number>>({});

    // Actualizar el tiempo restante cada segundo para todos los temas desbloqueados
    useEffect(() => {
        const updateTimers = () => {
            const newMap: Record<string, number> = {};
            unlockedThemes.forEach(({ themeId }) => {
                const remaining = getTimeRemaining(themeId);
                if (remaining) {
                    newMap[themeId] = remaining;
                }
            });
            setTimeRemainingMap(newMap);
        };

        updateTimers();
        const interval = setInterval(updateTimers, 1000);

        return () => clearInterval(interval);
    }, [getTimeRemaining, unlockedThemes]);

    // Función para formatear el tiempo restante
    const formatTimeRemaining = (ms: number): string => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    // Callback para cuando el usuario ve el anuncio completo
    const handleAdReward = useCallback(async () => {
        if (selectedPremiumTheme) {
            // Desbloquear SOLO este tema por 24 horas
            await unlockThemeTemporarily(selectedPremiumTheme);

            // Aplicar el tema (ahora el estado ya está actualizado)
            await setTheme(selectedPremiumTheme);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                '🎉 ¡Tema Desbloqueado!',
                `Has desbloqueado "${THEMES[selectedPremiumTheme].name}" por 24 horas.\n\n¡Disfruta tu tema premium!`,
                [{ text: 'Genial', style: 'default' }]
            );

            setSelectedPremiumTheme(null);
        }
    }, [selectedPremiumTheme, unlockThemeTemporarily, setTheme]);

    const { showAd, isLoaded, isLoading } = useSmartRewardedAd(handleAdReward);

    const handleThemeSelect = async (themeId: ThemeType) => {
        const theme = THEMES[themeId];
        const isUnlocked = isThemeUnlocked(themeId);

        // Solo mostrar el anuncio si es premium, no tiene premium Y no está desbloqueado
        if (theme.isPremium && !isPremium && !isUnlocked) {
            setSelectedPremiumTheme(themeId);

            // Siempre mostrar el diálogo primero
            Alert.alert(
                '🔒 Tema Premium',
                `"${theme.name}" es un tema premium.\n\n${theme.description}\n\n¿Quieres desbloquearlo por 24 horas viendo un anuncio?`,
                [
                    { text: 'Cancelar', style: 'cancel', onPress: () => setSelectedPremiumTheme(null) },
                    {
                        text: isLoaded ? '📺 Ver Anuncio' : (isLoading ? '⏳ Cargando...' : '📺 Ver Anuncio'),
                        onPress: () => {
                            if (isLoaded) {
                                showAd();
                            } else if (isLoading) {
                                // Esperar a que se cargue
                                Alert.alert(
                                    '⏳ Cargando anuncio',
                                    'El anuncio se está cargando, por favor espera un momento...',
                                    [
                                        { text: 'Cancelar', style: 'cancel', onPress: () => setSelectedPremiumTheme(null) },
                                        {
                                            text: 'Esperar',
                                            onPress: () => {
                                                // Verificar cada 500ms si el anuncio está listo
                                                const checkInterval = setInterval(() => {
                                                    if (isLoaded) {
                                                        clearInterval(checkInterval);
                                                        showAd();
                                                    }
                                                }, 500);

                                                // Timeout después de 10 segundos
                                                setTimeout(() => {
                                                    clearInterval(checkInterval);
                                                    if (!isLoaded) {
                                                        Alert.alert('⚠️ Anuncio no disponible', 'No se pudo cargar el anuncio. Intenta de nuevo en unos momentos.');
                                                        setSelectedPremiumTheme(null);
                                                    }
                                                }, 10000);
                                            }
                                        }
                                    ]
                                );
                            } else {
                                Alert.alert('⚠️ Anuncio no disponible', 'No se pudo cargar el anuncio. Intenta de nuevo en unos momentos.');
                                setSelectedPremiumTheme(null);
                            }
                        },
                        style: 'default'
                    },
                ]
            );
            return;
        }

        try {
            await setTheme(themeId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleColorSelect = async (themeId: MessageColorTheme) => {
        await setMessageColorTheme(themeId);
        setHasChanges(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleEmojiStyleSelect = async (styleId: EmojiStyle) => {
        await setEmojiStyle(styleId);
        setHasChanges(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setHasChanges(false);
        Alert.alert('✅ Guardado', 'Los cambios se aplicarán en el chat de mensajes');
    };

    const headerTheme = THEMES[currentTheme];
    const selectedColor = COLOR_THEMES.find(t => t.id === messageColorTheme) || COLOR_THEMES[0];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[headerTheme.colors.gradientStart, headerTheme.colors.gradientEnd]}
                style={styles.header}
            >
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Temas</Text>
                    <Text style={styles.headerSubtitle}>Personaliza tu experiencia</Text>
                </View>
                <View style={styles.backButton} />
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Vista Previa de Mensajes */}
                <View style={styles.previewSection}>
                    <Text style={styles.previewTitle}>VISTA PREVIA</Text>
                    <View style={styles.previewContainer}>
                        <View style={styles.sentMessageContainer}>
                            <View style={[styles.sentMessage, { backgroundColor: selectedColor.color }]}>
                                <Text style={styles.sentMessageText}>¡Hola amor! ¿Viste el nuevo tema?</Text>
                                <Text style={styles.messageEmoji}>😍</Text>
                            </View>
                            <View style={[styles.heartIcon, { backgroundColor: selectedColor.color + '20' }]}>
                                <Ionicons name="heart" size={20} color={selectedColor.color} />
                            </View>
                        </View>

                        <View style={styles.receivedMessageContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={20} color="#999" />
                            </View>
                            <View style={styles.receivedMessage}>
                                <Text style={styles.receivedMessageText}>Me encanta, el color se ve genial.</Text>
                                <Text style={styles.messageEmoji}>❤️</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Elige un Color */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Elige un Color</Text>

                    <View style={styles.colorsGrid}>
                        {COLOR_THEMES.map((theme) => {
                            const isSelected = messageColorTheme === theme.id;

                            return (
                                <Pressable
                                    key={theme.id}
                                    style={[
                                        styles.colorOption,
                                        isSelected && [styles.colorOptionSelected, { borderColor: theme.color }]
                                    ]}
                                    onPress={() => handleColorSelect(theme.id)}
                                >
                                    <View style={[styles.colorCircle, { backgroundColor: theme.color }]} />
                                    <Text style={styles.colorName}>{theme.name}</Text>
                                    {isSelected && (
                                        <View style={styles.checkIcon}>
                                            <Ionicons name="checkmark-circle" size={24} color={theme.color} />
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Estilo de Emoji */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Estilo de Emoji</Text>

                    <View style={styles.emojiStylesContainer}>
                        {EMOJI_STYLES.map((style) => {
                            const isSelected = emojiStyle === style.id;

                            return (
                                <Pressable
                                    key={style.id}
                                    style={[
                                        styles.emojiStyleOption,
                                        isSelected && [styles.emojiStyleOptionSelected, { borderColor: selectedColor.color, backgroundColor: selectedColor.color + '10' }]
                                    ]}
                                    onPress={() => handleEmojiStyleSelect(style.id)}
                                >
                                    <View style={styles.emojiStyleLeft}>
                                        <Text style={styles.emojiStyleIcon}>{style.icon}</Text>
                                        <View style={styles.emojiStyleInfo}>
                                            <Text style={styles.emojiStyleName}>{style.name}</Text>
                                            <Text style={styles.emojiStyleDescription}>{style.description}</Text>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.radioButton,
                                        isSelected && [styles.radioButtonSelected, { borderColor: selectedColor.color }]
                                    ]}>
                                        {isSelected && <View style={[styles.radioButtonInner, { backgroundColor: selectedColor.color }]} />}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Temas Gratuitos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Temas Gratuitos</Text>
                        <View style={styles.freeBadge}>
                            <Ionicons name="gift-outline" size={16} color="#10B981" />
                            <Text style={styles.freeBadgeText}>Gratis</Text>
                        </View>
                    </View>

                    <View style={styles.themesGrid}>
                        {FREE_THEMES.map((themeId) => {
                            const theme = THEMES[themeId];
                            const isSelected = currentTheme === themeId;

                            return (
                                <Pressable
                                    key={themeId}
                                    style={[
                                        styles.themeCard,
                                        isSelected && styles.selected
                                    ]}
                                    onPress={() => handleThemeSelect(themeId)}
                                >
                                    <View style={[styles.preview, { backgroundColor: theme.colors.primary }]}>
                                        <Text style={styles.emoji}>{theme.emoji}</Text>
                                        {isSelected && (
                                            <View style={styles.check}>
                                                <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.info}>
                                        <Text style={styles.name} numberOfLines={1}>{theme.name}</Text>
                                        <Text style={styles.description} numberOfLines={2}>{theme.description}</Text>
                                        <View style={styles.dots}>
                                            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                                            <View style={[styles.dot, { backgroundColor: theme.colors.secondary }]} />
                                            <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Temas Premium */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Temas Premium</Text>
                        <View style={styles.premiumBadge}>
                            <Ionicons name="star" size={16} color="#FBBF24" />
                            <Text style={styles.premiumBadgeText}>Premium</Text>
                        </View>
                    </View>

                    <View style={styles.themesGrid}>
                        {PREMIUM_THEMES.map((themeId) => {
                            const theme = THEMES[themeId];
                            const isSelected = currentTheme === themeId;
                            const isUnlocked = isThemeUnlocked(themeId);
                            const isLocked = !isPremium && !isUnlocked;
                            const timeRemaining = timeRemainingMap[themeId];

                            return (
                                <Pressable
                                    key={themeId}
                                    style={[
                                        styles.themeCard,
                                        isSelected && styles.selected,
                                        isUnlocked && styles.unlocked
                                    ]}
                                    onPress={() => handleThemeSelect(themeId)}
                                >
                                    <View style={[styles.preview, { backgroundColor: theme.colors.primary }]}>
                                        <Text style={styles.emoji}>{theme.emoji}</Text>

                                        {isLocked && (
                                            <View style={styles.lockBadge}>
                                                <Ionicons name="lock-closed" size={16} color="#FFF" />
                                            </View>
                                        )}

                                        {isUnlocked && timeRemaining && (
                                            <View style={styles.timerBadge}>
                                                <Ionicons name="time-outline" size={14} color="#FFF" />
                                                <Text style={styles.timerText}>
                                                    {formatTimeRemaining(timeRemaining)}
                                                </Text>
                                            </View>
                                        )}

                                        {isSelected && (
                                            <View style={styles.check}>
                                                <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.info}>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.name} numberOfLines={1}>{theme.name}</Text>
                                            {isUnlocked && (
                                                <View style={styles.unlockedBadge}>
                                                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.description} numberOfLines={2}>{theme.description}</Text>
                                        <View style={styles.dots}>
                                            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                                            <View style={[styles.dot, { backgroundColor: theme.colors.secondary }]} />
                                            <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {!isPremium && (
                    <Pressable style={styles.premiumCTA}>
                        <LinearGradient
                            colors={['#FBBF24', '#F59E0B']}
                            style={styles.premiumCTAGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="star" size={32} color="#FFF" />
                            <Text style={styles.premiumCTATitle}>Desbloquea Premium</Text>
                            <Text style={styles.premiumCTAText}>
                                Accede a todos los temas exclusivos
                            </Text>
                        </LinearGradient>
                    </Pressable>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Botón Guardar Cambios */}
            {hasChanges && (
                <View style={styles.saveButtonContainer}>
                    <Pressable style={styles.saveButton} onPress={handleSave}>
                        <LinearGradient
                            colors={[selectedColor.color, selectedColor.color + 'CC']}
                            style={styles.saveButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF'
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
        marginTop: 4
    },
    content: {
        flex: 1
    },

    // Vista Previa
    previewSection: {
        backgroundColor: '#FFF',
        marginTop: 20,
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    previewTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#E91E63',
        letterSpacing: 1,
        marginBottom: 16,
        textAlign: 'center',
    },
    previewContainer: {
        gap: 16,
    },
    sentMessageContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
    },
    sentMessage: {
        maxWidth: '75%',
        borderRadius: 20,
        borderTopRightRadius: 4,
        padding: 12,
        paddingHorizontal: 16,
    },
    sentMessageText: {
        color: '#FFF',
        fontSize: 14,
        lineHeight: 20,
    },
    messageEmoji: {
        fontSize: 16,
        marginTop: 4,
    },
    heartIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    receivedMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    receivedMessage: {
        maxWidth: '75%',
        borderRadius: 20,
        borderTopLeftRadius: 4,
        padding: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F5F5F5',
    },
    receivedMessageText: {
        color: '#333',
        fontSize: 14,
        lineHeight: 20,
    },

    // Secciones
    section: {
        padding: 20,
        paddingTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111'
    },

    // Colores
    colorsGrid: {
        gap: 12,
    },
    colorOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    colorOptionSelected: {
        backgroundColor: '#FFF5F8',
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    colorName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    checkIcon: {
        marginLeft: 8,
    },

    // Estilos de Emoji
    emojiStylesContainer: {
        gap: 12,
    },
    emojiStyleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    emojiStyleOptionSelected: {
    },
    emojiStyleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    emojiStyleIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    emojiStyleInfo: {
        flex: 1,
    },
    emojiStyleName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    emojiStyleDescription: {
        fontSize: 13,
        color: '#999',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },

    // Temas de la App
    freeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    freeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46'
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    premiumBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E'
    },
    themesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16
    },
    themeCard: {
        width: '47%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    selected: {
        borderColor: '#10B981',
        borderWidth: 3
    },
    unlocked: {
        borderColor: '#10B981',
        borderWidth: 2,
        backgroundColor: '#F0FDF4'
    },
    preview: {
        height: 120,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emoji: {
        fontSize: 48
    },
    check: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 2
    },
    lockBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8
    },
    timerBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    timerText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFF'
    },
    info: {
        padding: 12
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        flex: 1
    },
    unlockedBadge: {
        backgroundColor: '#D1FAE5',
        borderRadius: 10,
        padding: 3
    },
    description: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 8,
        lineHeight: 14
    },
    dots: {
        flexDirection: 'row',
        gap: 6
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#FFF'
    },
    premiumCTA: {
        margin: 20,
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5
    },
    premiumCTAGradient: {
        padding: 24,
        alignItems: 'center'
    },
    premiumCTATitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 12,
        marginBottom: 8
    },
    premiumCTAText: {
        fontSize: 14,
        color: '#FFF',
        textAlign: 'center',
        opacity: 0.9
    },

    // Botón Guardar
    saveButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    saveButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
