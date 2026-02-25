import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';
import { FOODS, DIETARY_OPTIONS, type CookingSkill } from '@/core/types/interests';

export default function FoodScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { updateInterests } = useInterestsStore();

    const [favoriteFood, setFavoriteFood] = useState('');
    const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
    const [cookingSkill, setCookingSkill] = useState<CookingSkill | null>(null);
    const [loading, setLoading] = useState(false);

    const cookingLevels: { value: CookingSkill; label: string; emoji: string }[] = [
        { value: 'none', label: 'No sé cocinar', emoji: '🤷' },
        { value: 'basic', label: 'Básico', emoji: '🍳' },
        { value: 'intermediate', label: 'Intermedio', emoji: '👨‍🍳' },
        { value: 'expert', label: 'Experto', emoji: '⭐' },
    ];

    const toggleDietary = (dietary: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDietary((prev) =>
            prev.includes(dietary) ? prev.filter((d) => d !== dietary) : [...prev, dietary]
        );
    };

    const handleContinue = async () => {
        if (!user) {
            Alert.alert('Error', 'No se encontró el usuario');
            return;
        }

        setLoading(true);
        try {
            await updateInterests(user.id, {
                food_favorite_food: favoriteFood || undefined,
                food_dietary: selectedDietary,
                food_cooking_skill: cookingSkill || undefined,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch (error) {
            console.error('Error updating food interests:', error);
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
        <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <View style={styles.headerRight}>
                        <Text style={styles.step}>Paso 5 de 7</Text>
                        <Pressable onPress={handleSkip}>
                            <Text style={styles.skipText}>Saltar</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '71%' }]} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.emoji}>🍕</Text>
                    <Text style={styles.title}>Comida</Text>
                    <Text style={styles.subtitle}>
                        ¿Qué te gusta comer?
                    </Text>

                    {/* Comida Favorita */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Comida favorita</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Sushi, Pizza, Tacos..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={favoriteFood}
                            onChangeText={setFavoriteFood}
                            maxLength={50}
                        />
                    </View>

                    {/* Dieta */}
                    <View style={styles.dietaryContainer}>
                        <Text style={styles.inputLabel}>Tu dieta</Text>
                        <View style={styles.dietaryGrid}>
                            {DIETARY_OPTIONS.map((dietary) => {
                                const isSelected = selectedDietary.includes(dietary);
                                return (
                                    <Pressable
                                        key={dietary}
                                        style={[styles.dietaryChip, isSelected && styles.dietaryChipSelected]}
                                        onPress={() => toggleDietary(dietary)}
                                    >
                                        <Text style={[styles.dietaryText, isSelected && styles.dietaryTextSelected]}>
                                            {dietary}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Nivel de Cocina */}
                    <View style={styles.cookingContainer}>
                        <Text style={styles.inputLabel}>¿Sabes cocinar?</Text>
                        <View style={styles.cookingGrid}>
                            {cookingLevels.map((level) => {
                                const isSelected = cookingSkill === level.value;
                                return (
                                    <Pressable
                                        key={level.value}
                                        style={[styles.cookingCard, isSelected && styles.cookingCardSelected]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setCookingSkill(level.value);
                                        }}
                                    >
                                        <Text style={styles.cookingEmoji}>{level.emoji}</Text>
                                        <Text style={[styles.cookingLabel, isSelected && styles.cookingLabelSelected]}>
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
    dietaryContainer: {
        marginBottom: 24,
    },
    dietaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    dietaryChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    dietaryChipSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    dietaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    dietaryTextSelected: {
        color: '#f093fb',
    },
    cookingContainer: {
        marginBottom: 24,
    },
    cookingGrid: {
        gap: 12,
    },
    cookingCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    cookingCardSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    cookingEmoji: {
        fontSize: 32,
    },
    cookingLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    cookingLabelSelected: {
        color: '#f093fb',
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
