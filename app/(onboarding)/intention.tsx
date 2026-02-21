import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';
import { INTENTIONS, type IntentionType } from '@/core/types/interests';

export default function IntentionScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { setIntention } = useInterestsStore();
    const [selectedIntention, setSelectedIntention] = useState<IntentionType | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSelectIntention = (intention: IntentionType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedIntention(intention);
    };

    const handleContinue = async () => {
        if (!selectedIntention) {
            Alert.alert('Selecciona una opción', 'Por favor elige qué buscas en Palpitos');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'No se encontró el usuario');
            return;
        }

        setLoading(true);
        try {
            await setIntention(user.id, selectedIntention);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/(onboarding)/music');
        } catch (error) {
            console.error('Error setting intention:', error);
            Alert.alert('Error', 'No se pudo guardar tu selección');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#FF6B9D', '#FFA8C5']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.step}>Paso 1 de 7</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '14%' }]} />
                    </View>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>¿Qué buscas en Palpitos?</Text>
                    <Text style={styles.subtitle}>
                        Esto nos ayudará a conectarte con las personas indicadas
                    </Text>

                    <View style={styles.optionsContainer}>
                        {(Object.keys(INTENTIONS) as IntentionType[]).map((key) => {
                            const intention = INTENTIONS[key];
                            const isSelected = selectedIntention === key;

                            return (
                                <Pressable
                                    key={key}
                                    style={[
                                        styles.optionCard,
                                        isSelected && styles.optionCardSelected,
                                    ]}
                                    onPress={() => handleSelectIntention(key)}
                                >
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionEmoji}>{intention.emoji}</Text>
                                        <View style={styles.optionText}>
                                            <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                                                {intention.label}
                                            </Text>
                                            <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                                                {intention.description}
                                            </Text>
                                        </View>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={28} color="#FFF" />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable
                        style={[styles.continueButton, !selectedIntention && styles.continueButtonDisabled]}
                        onPress={handleContinue}
                        disabled={!selectedIntention || loading}
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
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    step: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 12,
        opacity: 0.9,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
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
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: '#FFF',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 16,
    },
    optionEmoji: {
        fontSize: 40,
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#181113',
        marginBottom: 4,
    },
    optionLabelSelected: {
        color: '#FFF',
    },
    optionDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    optionDescriptionSelected: {
        color: 'rgba(255, 255, 255, 0.9)',
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
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
