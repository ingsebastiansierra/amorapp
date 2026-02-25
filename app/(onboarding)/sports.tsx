import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';
import { SPORTS, type ActivityLevel } from '@/core/types/interests';

export default function SportsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { updateInterests } = useInterestsStore();

    const [favoriteSport, setFavoriteSport] = useState('');
    const [favoriteTeam, setFavoriteTeam] = useState('');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
    const [loading, setLoading] = useState(false);

    const activityLevels: { value: ActivityLevel; label: string; emoji: string }[] = [
        { value: 'sedentary', label: 'Sedentario', emoji: '🛋️' },
        { value: 'light', label: 'Ligero', emoji: '🚶' },
        { value: 'moderate', label: 'Moderado', emoji: '🏃' },
        { value: 'active', label: 'Activo', emoji: '💪' },
        { value: 'very_active', label: 'Muy Activo', emoji: '🔥' },
    ];

    const handleContinue = async () => {
        if (!user) {
            Alert.alert('Error', 'No se encontró el usuario');
            return;
        }

        setLoading(true);
        try {
            await updateInterests(user.id, {
                sports_favorite_sport: favoriteSport || undefined,
                sports_favorite_team: favoriteTeam || undefined,
                sports_activity_level: activityLevel || undefined,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch (error) {
            console.error('Error updating sports interests:', error);
            Alert.alert('Error', 'No se pudo guardar tu información');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <View style={styles.headerRight}>
                        <Text style={styles.step}>Paso 4 de 7</Text>
                        <Pressable onPress={handleSkip}>
                            <Text style={styles.skipText}>Saltar</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '57%' }]} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.emoji}>⚽</Text>
                    <Text style={styles.title}>Deportes & Fitness</Text>
                    <Text style={styles.subtitle}>
                        Cuéntanos sobre tu actividad física
                    </Text>

                    {/* Deporte Favorito */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Deporte favorito</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Fútbol, Basketball..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={favoriteSport}
                            onChangeText={setFavoriteSport}
                            maxLength={50}
                        />
                    </View>

                    {/* Equipo Favorito */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Equipo favorito (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Real Madrid, Lakers..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={favoriteTeam}
                            onChangeText={setFavoriteTeam}
                            maxLength={50}
                        />
                    </View>

                    {/* Nivel de Actividad */}
                    <View style={styles.activityContainer}>
                        <Text style={styles.inputLabel}>Nivel de actividad</Text>
                        <View style={styles.activityGrid}>
                            {activityLevels.map((level) => {
                                const isSelected = activityLevel === level.value;
                                return (
                                    <Pressable
                                        key={level.value}
                                        style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setActivityLevel(level.value);
                                        }}
                                    >
                                        <Text style={styles.activityEmoji}>{level.emoji}</Text>
                                        <Text style={[styles.activityLabel, isSelected && styles.activityLabelSelected]}>
                                            {level.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable
                        style={styles.continueButton}
                        onPress={handleContinue}
                        disabled={loading}
                    >
                        <Text style={styles.continueButtonText}>
                            {loading ? 'Guardando...' : 'Continuar'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </Pressable>
                </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    step: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
        opacity: 0.9,
    },
    skipText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 24,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 24,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFF',
        borderRadius: 2,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#FFF',
        opacity: 0.9,
        marginBottom: 32,
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 12,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
        color: '#FFF',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    activityContainer: {
        marginBottom: 24,
    },
    activityGrid: {
        gap: 12,
    },
    activityCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    activityCardSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    activityEmoji: {
        fontSize: 32,
    },
    activityLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    activityLabelSelected: {
        color: '#11998e',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 16,
    },
    continueButton: {
        backgroundColor: '#181113',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
