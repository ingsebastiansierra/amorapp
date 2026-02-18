import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/core/store/useThemeStore';
import { THEMES, FREE_THEMES, PREMIUM_THEMES } from '@/core/config/themes';
import { ThemeType } from '@/core/types/theme';
import * as Haptics from 'expo-haptics';

export default function ThemeSettingsScreen() {
    const router = useRouter();
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setTheme = useThemeStore(state => state.setTheme);
    const isPremium = useThemeStore(state => state.isPremium);

    const handleThemeSelect = async (themeId: ThemeType) => {
        const theme = THEMES[themeId];

        if (theme.isPremium && !isPremium) {
            Alert.alert(
                '🔒 Tema Premium',
                `"${theme.name}" requiere suscripción Premium.\n\n${theme.description}`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Ver Premium',
                        onPress: () => Alert.alert('Próximamente', 'Suscripción Premium disponible pronto'),
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

    const headerTheme = THEMES[currentTheme];

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

            <ScrollView style={styles.content}>
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
                            const isLocked = !isPremium;

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

                                        {isLocked && (
                                            <View style={styles.lockBadge}>
                                                <Ionicons name="lock-closed" size={16} color="#FFF" />
                                            </View>
                                        )}

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
            </ScrollView>
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
    section: {
        padding: 20
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
    info: {
        padding: 12
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4
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
    }
});
