// Componente para mostrar una nota de voz pendiente
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
} from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { VoiceNote } from '@/core/types/voice';
import { useVoiceNotes } from '../hooks/useVoiceNotes';
import { Audio } from 'expo-av';

interface Props {
    note: VoiceNote;
}

export function VoiceNoteCard({ note }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [progress, setProgress] = useState(0);
    const { playVoiceNote, currentlyPlaying } = useVoiceNotes();
    const waveAnim = useState(new Animated.Value(1))[0];

    // Bloquear capturas de pantalla cuando se está reproduciendo
    useEffect(() => {
        if (isPlaying) {
            ScreenCapture.preventScreenCaptureAsync();

            // Animación de onda
            Animated.loop(
                Animated.sequence([
                    Animated.timing(waveAnim, {
                        toValue: 1.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(waveAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            return () => {
                ScreenCapture.allowScreenCaptureAsync();
            };
        } else {
            waveAnim.setValue(1);
        }
    }, [isPlaying]);

    // Limpiar sonido al desmontar
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // Actualizar progreso
    useEffect(() => {
        if (!sound || !isPlaying) return;

        const interval = setInterval(async () => {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
                const currentProgress = status.positionMillis / status.durationMillis;
                setProgress(currentProgress);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [sound, isPlaying]);

    const handlePlay = async () => {
        if (isPlaying || currentlyPlaying) return;

        try {
            setIsLoading(true);
            const playedSound = await playVoiceNote(note.id, note.storage_path);
            setSound(playedSound);
            setIsPlaying(true);
        } catch (error) {
            console.error('Error playing note:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes}m`;
        return `Hace ${hours}h`;
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <TouchableOpacity
            style={[styles.card, isPlaying && styles.cardPlaying]}
            onPress={handlePlay}
            disabled={isLoading || isPlaying || !!currentlyPlaying}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                {isPlaying ? (
                    <Animated.View style={{ transform: [{ scale: waveAnim }] }}>
                        <Text style={styles.playingIcon}>🔊</Text>
                    </Animated.View>
                ) : (
                    <Text style={styles.icon}>🎤</Text>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Nota de voz</Text>

                {isPlaying ? (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>Reproduciendo...</Text>
                    </View>
                ) : (
                    <View style={styles.footer}>
                        <Text style={styles.duration}>⏱️ {formatDuration(note.duration)}</Text>
                        <Text style={styles.time}>{formatTime(note.created_at)}</Text>
                    </View>
                )}

                {!isPlaying && (
                    <Text style={styles.warning}>🔥 Se autodestruirá al escucharla</Text>
                )}
            </View>

            {isLoading && (
                <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
            )}

            {isPlaying && (
                <View style={styles.protectionBadge}>
                    <Text style={styles.protectionText}>🔒</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardPlaying: {
        backgroundColor: '#F0F8FF',
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 32,
    },
    playingIcon: {
        fontSize: 32,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    duration: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    warning: {
        fontSize: 11,
        color: '#FF3B30',
        fontWeight: '500',
    },
    progressContainer: {
        marginTop: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    progressText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    loader: {
        marginLeft: 8,
    },
    protectionBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    protectionText: {
        fontSize: 12,
        color: '#FFF',
    },
});
