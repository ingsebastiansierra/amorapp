import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';
import { ProfileProgressCard } from '@/shared/components/ProfileProgressCard';

interface QuestionnaireItem {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    completed: boolean;
    route: string;
}

export default function PreRegistrationScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { interests: userInterests, loadInterests } = useInterestsStore();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadInterests(user.id);
        }
    }, [user]);

    // Recargar intereses cada vez que el usuario regrese a esta pantalla
    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                loadInterests(user.id);
            }
        }, [user])
    );

    const questionnaires: QuestionnaireItem[] = [
        {
            id: 'music',
            title: 'Música',
            icon: 'musical-notes',
            completed: !!userInterests?.music_favorite_artist,
            route: '/(onboarding)/music',
        },
        {
            id: 'entertainment',
            title: 'Entretenimiento',
            icon: 'film',
            completed: !!userInterests?.entertainment_favorite_movie,
            route: '/(onboarding)/entertainment',
        },
        {
            id: 'sports',
            title: 'Deportes',
            icon: 'football',
            completed: !!userInterests?.sports_favorite_sport,
            route: '/(onboarding)/sports',
        },
        {
            id: 'food',
            title: 'Comida',
            icon: 'restaurant',
            completed: !!userInterests?.food_favorite_food,
            route: '/(onboarding)/food',
        },
        {
            id: 'lifestyle',
            title: 'Estilo de Vida',
            icon: 'heart',
            completed: !!userInterests?.lifestyle_favorite_color,
            route: '/(onboarding)/lifestyle',
        },
    ];

    const completedCount = questionnaires.filter(q => q.completed).length;
    const totalCount = questionnaires.length;
    const progress = (completedCount / totalCount) * 100;
    const allCompleted = completedCount === totalCount;

    const handleQuestionnairePress = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(route as any);
    };

    const handleContinue = () => {
        if (!allCompleted) {
            Alert.alert(
                'Cuestionarios Incompletos',
                'Por favor completa todos los cuestionarios antes de continuar.',
                [{ text: 'OK' }]
            );
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Ir a la pantalla de preferencias (último paso)
        router.replace('/(onboarding)/preferences');
    };

    const handleSkip = () => {
        Alert.alert(
            'Saltar Cuestionarios',
            '¿Estás seguro? Completar tu perfil te ayudará a encontrar mejores conexiones.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Saltar',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.replace('/(onboarding)/preferences');
                    },
                },
            ]
        );
    };

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.step}>Completa tu Perfil</Text>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.emoji}>✨</Text>
                    <Text style={styles.title}>¡Bienvenido!</Text>
                    <Text style={styles.subtitle}>
                        Completa estos cuestionarios para que podamos conocerte mejor y ayudarte a encontrar conexiones más significativas.
                    </Text>

                    {/* Progress Card */}
                    <ProfileProgressCard
                        progress={progress}
                        questionnaires={questionnaires}
                        onQuestionnairePress={handleQuestionnairePress}
                    />

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color="#FFF" />
                        <Text style={styles.infoText}>
                            Completa todos los cuestionarios para desbloquear el botón de continuar
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable
                        style={[styles.continueButton, !allCompleted && styles.continueButtonDisabled]}
                        onPress={handleContinue}
                        disabled={!allCompleted}
                    >
                        <Text style={styles.continueButtonText}>
                            Continuar
                        </Text>
                        <Ionicons name="arrow-forward" size={24} color="#FFF" />
                    </Pressable>

                    <Pressable
                        style={styles.skipButton}
                        onPress={handleSkip}
                    >
                        <Text style={styles.skipButtonText}>
                            Saltar por ahora
                        </Text>
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
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        alignItems: 'center',
    },
    step: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '700',
        opacity: 0.9,
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
        textAlign: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#FFF',
        opacity: 0.9,
        marginBottom: 32,
        lineHeight: 24,
        textAlign: 'center',
    },
    infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#FFF',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 16,
        gap: 12,
    },
    continueButton: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: '#667eea',
        fontSize: 17,
        fontWeight: '700',
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        opacity: 0.8,
    },
});
