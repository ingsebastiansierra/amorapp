import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';
import { MUSIC_GENRES } from '@/core/types/interests';

export default function MusicScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { updateInterests } = useInterestsStore();

    const [favoriteArtist, setFavoriteArtist] = useState('');
    const [favoriteSong, setFavoriteSong] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleGenre = (genre: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedGenres((prev) =>
            prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
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
                music_favorite_artist: favoriteArtist || undefined,
                music_favorite_song: favoriteSong || undefined,
                music_genres: selectedGenres,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/(onboarding)/entertainment');
        } catch (error) {
            console.error('Error updating music interests:', error);
            Alert.alert('Error', 'No se pudo guardar tu información');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(onboarding)/entertainment');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <LinearGradient colors={['#9F7AEA', '#B794F4']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <View style={styles.headerRight}>
                        <Text style={styles.step}>Paso 2 de 7</Text>
                        <Pressable onPress={handleSkip}>
                            <Text style={styles.skipText}>Saltar</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '28%' }]} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.emoji}>🎵</Text>
                    <Text style={styles.title}>Tu Música</Text>
                    <Text style={styles.subtitle}>
                        Cuéntanos sobre tus gustos musicales
                    </Text>

                    {/* Artista Favorito */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Artista favorito</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Bad Bunny, Taylor Swift..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={favoriteArtist}
                            onChangeText={setFavoriteArtist}
                            maxLength={50}
                        />
                    </View>

                    {/* Canción Favorita */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Canción favorita</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Tití Me Preguntó..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={favoriteSong}
                            onChangeText={setFavoriteSong}
                            maxLength={50}
                        />
                    </View>

                    {/* Géneros */}
                    <View style={styles.genresContainer}>
                        <Text style={styles.inputLabel}>Géneros que te gustan</Text>
                        <View style={styles.genresGrid}>
                            {MUSIC_GENRES.map((genre) => {
                                const isSelected = selectedGenres.includes(genre);
                                return (
                                    <Pressable
                                        key={genre}
                                        style={[styles.genreChip, isSelected && styles.genreChipSelected]}
                                        onPress={() => toggleGenre(genre)}
                                    >
                                        <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>
                                            {genre}
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
    genresContainer: {
        marginBottom: 24,
    },
    genresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    genreChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    genreChipSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    genreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    genreTextSelected: {
        color: '#9F7AEA',
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
