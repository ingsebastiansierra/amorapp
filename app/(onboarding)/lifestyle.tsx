import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';
import { COLORS, ZODIAC_SIGNS, type CircadianRhythm } from '@/core/types/interests';

export default function LifestyleScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { updateInterests } = useInterestsStore();

    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedZodiac, setSelectedZodiac] = useState<string | null>(null);
    const [rhythm, setRhythm] = useState<CircadianRhythm | null>(null);
    const [loading, setLoading] = useState(false);

    const rhythmOptions: { value: CircadianRhythm; label: string; emoji: string; description: string }[] = [
        { value: 'night_owl', label: 'Búho Nocturno', emoji: '🦉', description: 'Me activo de noche' },
        { value: 'early_bird', label: 'Madrugador', emoji: '🐓', description: 'Me levanto temprano' },
        { value: 'flexible', label: 'Flexible', emoji: '🌓', description: 'Me adapto' },
    ];

    const handleContinue = async () => {
        if (!user) {
            Alert.alert('Error', 'No se encontró el usuario');
            return;
        }

        setLoading(true);
        try {
            await updateInterests(user.id, {
                lifestyle_favorite_color: selectedColor || undefined,
                lifestyle_zodiac_sign: selectedZodiac || undefined,
                lifestyle_rhythm: rhythm || undefined,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/(onboarding)/preferences');
        } catch (error) {
            console.error('Error updating lifestyle interests:', error);
            Alert.alert('Error', 'No se pudo guardar tu información');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(onboarding)/preferences');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <View style={styles.headerRight}>
                        <Text style={styles.step}>Paso 6 de 7</Text>
                        <Pressable onPress={handleSkip}>
                            <Text style={styles.skipText}>Saltar</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '85%' }]} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.emoji}>🎨</Text>
                    <Text style={styles.title}>Tu Estilo</Text>
                    <Text style={styles.subtitle}>
                        Cuéntanos un poco más sobre ti
                    </Text>

                    {/* Color Favorito */}
                    <View style={styles.colorContainer}>
                        <Text style={styles.inputLabel}>Color favorito</Text>
                        <View style={styles.colorGrid}>
                            {COLORS.map((color) => {
                                const isSelected = selectedColor === color.name;
                                return (
                                    <Pressable
                                        key={color.name}
                                        style={[styles.colorChip, isSelected && styles.colorChipSelected]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedColor(color.name);
                                        }}
                                    >
                                        <Text style={styles.colorEmoji}>{color.emoji}</Text>
                                        <Text style={[styles.colorText, isSelected && styles.colorTextSelected]}>
                                            {color.name}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Ritmo Circadiano */}
                    <View style={styles.rhythmContainer}>
                        <Text style={styles.inputLabel}>Eres más...</Text>
                        <View style={styles.rhythmGrid}>
                            {rhythmOptions.map((option) => {
                                const isSelected = rhythm === option.value;
                                return (
                                    <Pressable
                                        key={option.value}
                                        style={[styles.rhythmCard, isSelected && styles.rhythmCardSelected]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setRhythm(option.value);
                                        }}
                                    >
                                        <Text style={styles.rhythmEmoji}>{option.emoji}</Text>
                                        <View style={styles.rhythmText}>
                                            <Text style={[styles.rhythmLabel, isSelected && styles.rhythmLabelSelected]}>
                                                {option.label}
                                            </Text>
                                            <Text style={[styles.rhythmDescription, isSelected && styles.rhythmDescriptionSelected]}>
                                                {option.description}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Signo Zodiacal */}
                    <View style={styles.zodiacContainer}>
                        <Text style={styles.inputLabel}>Signo zodiacal (opcional)</Text>
                        <View style={styles.zodiacGrid}>
                            {ZODIAC_SIGNS.map((sign) => {
                                const isSelected = selectedZodiac === sign.name;
                                return (
                                    <Pressable
                                        key={sign.name}
                                        style={[styles.zodiacChip, isSelected && styles.zodiacChipSelected]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedZodiac(sign.name);
                                        }}
                                    >
                                        <Text style={styles.zodiacEmoji}>{sign.emoji}</Text>
                                        <Text style={[styles.zodiacText, isSelected && styles.zodiacTextSelected]}>
                                            {sign.name}
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
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 12,
    },
    colorContainer: {
        marginBottom: 24,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    colorChipSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    colorEmoji: {
        fontSize: 20,
    },
    colorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    colorTextSelected: {
        color: '#4facfe',
    },
    rhythmContainer: {
        marginBottom: 24,
    },
    rhythmGrid: {
        gap: 12,
    },
    rhythmCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    rhythmCardSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    rhythmEmoji: {
        fontSize: 32,
    },
    rhythmText: {
        flex: 1,
    },
    rhythmLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
    },
    rhythmLabelSelected: {
        color: '#4facfe',
    },
    rhythmDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    rhythmDescriptionSelected: {
        color: '#6B7280',
    },
    zodiacContainer: {
        marginBottom: 24,
    },
    zodiacGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    zodiacChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    zodiacChipSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    zodiacEmoji: {
        fontSize: 20,
    },
    zodiacText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    zodiacTextSelected: {
        color: '#4facfe',
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
