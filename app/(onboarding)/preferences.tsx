import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';

export default function PreferencesScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { updatePreferences, markProfileAsCompleted } = useInterestsStore();

    const [lookingForGender, setLookingForGender] = useState<'male' | 'female' | 'any'>('any');
    const [ageRange, setAgeRange] = useState<[number, number]>([18, 35]);
    const [maxDistance, setMaxDistance] = useState(50);
    const [loading, setLoading] = useState(false);

    const genderOptions: { value: 'male' | 'female' | 'any'; label: string; emoji: string }[] = [
        { value: 'male', label: 'Hombres', emoji: '👨' },
        { value: 'female', label: 'Mujeres', emoji: '👩' },
        { value: 'any', label: 'Todos', emoji: '👥' },
    ];

    const handleFinish = async () => {
        if (!user) {
            Alert.alert('Error', 'No se encontró el usuario');
            return;
        }

        setLoading(true);
        try {
            // Guardar preferencias
            await updatePreferences(user.id, {
                looking_for_gender: lookingForGender,
                age_range_min: ageRange[0],
                age_range_max: ageRange[1],
                distance_max_km: maxDistance,
            });

            // Marcar perfil como completado
            await markProfileAsCompleted(user.id);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Ir a la pantalla principal
            router.replace('/(app)/home');
        } catch (error) {
            console.error('Error finishing onboarding:', error);
            Alert.alert('Error', 'No se pudo completar el registro');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <LinearGradient colors={['#fa709a', '#fee140']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <Text style={styles.step}>Paso 7 de 7</Text>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '100%' }]} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.emoji}>🎯</Text>
                    <Text style={styles.title}>¿Qué buscas?</Text>
                    <Text style={styles.subtitle}>
                        Configura tus preferencias de búsqueda
                    </Text>

                    {/* Género */}
                    <View style={styles.genderContainer}>
                        <Text style={styles.inputLabel}>Quiero conocer</Text>
                        <View style={styles.genderGrid}>
                            {genderOptions.map((option) => {
                                const isSelected = lookingForGender === option.value;
                                return (
                                    <Pressable
                                        key={option.value}
                                        style={[styles.genderCard, isSelected && styles.genderCardSelected]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setLookingForGender(option.value);
                                        }}
                                    >
                                        <Text style={styles.genderEmoji}>{option.emoji}</Text>
                                        <Text style={[styles.genderLabel, isSelected && styles.genderLabelSelected]}>
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Rango de Edad */}
                    <View style={styles.ageContainer}>
                        <Text style={styles.inputLabel}>
                            Rango de edad: {ageRange[0]} - {ageRange[1]} años
                        </Text>
                        <View style={styles.sliderContainer}>
                            <Text style={styles.sliderLabel}>Mínimo: {ageRange[0]}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={18}
                                maximumValue={100}
                                step={1}
                                value={ageRange[0]}
                                onValueChange={(value) => {
                                    if (value < ageRange[1]) {
                                        setAgeRange([value, ageRange[1]]);
                                    }
                                }}
                                minimumTrackTintColor="#FFF"
                                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                thumbTintColor="#FFF"
                            />
                        </View>
                        <View style={styles.sliderContainer}>
                            <Text style={styles.sliderLabel}>Máximo: {ageRange[1]}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={18}
                                maximumValue={100}
                                step={1}
                                value={ageRange[1]}
                                onValueChange={(value) => {
                                    if (value > ageRange[0]) {
                                        setAgeRange([ageRange[0], value]);
                                    }
                                }}
                                minimumTrackTintColor="#FFF"
                                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                thumbTintColor="#FFF"
                            />
                        </View>
                    </View>

                    {/* Distancia Máxima */}
                    <View style={styles.distanceContainer}>
                        <Text style={styles.inputLabel}>
                            Distancia máxima: {maxDistance} km
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={500}
                            step={1}
                            value={maxDistance}
                            onValueChange={setMaxDistance}
                            minimumTrackTintColor="#FFF"
                            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                            thumbTintColor="#FFF"
                        />
                        <View style={styles.distanceLabels}>
                            <Text style={styles.distanceLabel}>1 km</Text>
                            <Text style={styles.distanceLabel}>500 km</Text>
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color="#FFF" />
                        <Text style={styles.infoText}>
                            Puedes cambiar estas preferencias en cualquier momento desde tu perfil
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable
                        style={styles.finishButton}
                        onPress={handleFinish}
                        disabled={loading}
                    >
                        <Text style={styles.finishButtonText}>
                            {loading ? 'Finalizando...' : '¡Empezar a Conectar!'}
                        </Text>
                        <Ionicons name="checkmark-circle" size={24} color="#FFF" />
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
    step: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
        opacity: 0.9,
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
    genderContainer: {
        marginBottom: 32,
    },
    genderGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    genderCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        gap: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    genderCardSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    genderEmoji: {
        fontSize: 40,
    },
    genderLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    genderLabelSelected: {
        color: '#fa709a',
    },
    ageContainer: {
        marginBottom: 32,
    },
    sliderContainer: {
        marginBottom: 16,
    },
    sliderLabel: {
        fontSize: 14,
        color: '#FFF',
        marginBottom: 8,
        opacity: 0.9,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    distanceContainer: {
        marginBottom: 32,
    },
    distanceLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    distanceLabel: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.8,
    },
    infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
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
    },
    finishButton: {
        backgroundColor: '#181113',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    finishButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
