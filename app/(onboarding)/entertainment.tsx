import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';
import { HOBBIES } from '@/core/types/interests';

export default function EntertainmentScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { updateInterests } = useInterestsStore();

    const [favoriteMovie, setFavoriteMovie] = useState('');
    const [favoriteSeries, setFavoriteSeries] = useState('');
    const [favoriteBook, setFavoriteBook] = useState('');
    const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleHobby = (hobby: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedHobbies((prev) =>
            prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
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
                entertainment_favorite_movie: favoriteMovie || undefined,
                entertainment_favorite_series: favoriteSeries || undefined,
                entertainment_favorite_book: favoriteBook || undefined,
                entertainment_hobbies: selectedHobbies,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/(onboarding)/sports');
        } catch (error) {
            console.error('Error updating entertainment interests:', error);
            Alert.alert('Error', 'No se pudo guardar tu información');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(onboarding)/sports');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <View style={styles.headerRight}>
                        <Text style={styles.step}>Paso 3 de 7</Text>
                        <Pressable onPress={handleSkip}>
                            <Text style={styles.skipText}>Saltar</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '42%' }]} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.emoji}>🎬</Text>
                    <Text style={styles.title}>Entretenimiento</Text>
                    <Text style={styles.subtitle}>
                        ¿Qué te gusta hacer en tu tiempo libre?
                    </Text>

                    {/* Película Favorita */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Película favorita</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Inception, Avengers..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={favoriteMovie}
                            onChangeText={setFavoriteMovie}
                            maxLength={50}
                        />
                    </View>

                    {/* Serie Favorita */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Serie favorita</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Breaking Bad, Friends..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={favoriteSeries}
                            onChangeText={setFavoriteSeries}
                            maxLength={50}
                        />
                    </View>

                    {/* Libro Favorito (Opcional) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Libro favorito (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Harry Potter..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={favoriteBook}
                            onChangeText={setFavoriteBook}
                            maxLength={50}
                        />
                    </View>

                    {/* Hobbies */}
                    <View style={styles.hobbiesContainer}>
                        <Text style={styles.inputLabel}>Tus hobbies</Text>
                        <View style={styles.hobbiesGrid}>
                            {HOBBIES.map((hobby) => {
                                const isSelected = selectedHobbies.includes(hobby);
                                return (
                                    <Pressable
                                        key={hobby}
                                        style={[styles.hobbyChip, isSelected && styles.hobbyChipSelected]}
                                        onPress={() => toggleHobby(hobby)}
                                    >
                                        <Text style={[styles.hobbyText, isSelected && styles.hobbyTextSelected]}>
                                            {hobby}
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
    hobbiesContainer: {
        marginBottom: 24,
    },
    hobbiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    hobbyChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    hobbyChipSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    hobbyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    hobbyTextSelected: {
        color: '#667eea',
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
