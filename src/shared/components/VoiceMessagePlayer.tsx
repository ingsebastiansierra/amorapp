// Componente para reproducir notas de voz en el chat
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { voiceService } from '@/core/services/voiceService';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface Props {
    voiceId: string;
    storagePath: string;
    duration: number;
    waveform?: number[];
    isFromMe: boolean;
    onListened?: () => void;
}

export function VoiceMessagePlayer({ voiceId, storagePath, duration, isFromMe }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = async () => {
        try {
            if (isPlaying && sound) {
                await sound.pauseAsync();
                setIsPlaying(false);
                return;
            }

            if (sound) {
                await sound.playAsync();
                setIsPlaying(true);
                return;
            }

            // Primera reproducción
            setIsLoading(true);
            const url = await voiceService.getVoiceNoteUrl(storagePath);
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );

            setSound(newSound);
            setIsPlaying(true);

            // Actualizar progreso
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && !isSeeking) {
                    const progressPercent = status.positionMillis / status.durationMillis;
                    setProgress(progressPercent);
                    setCurrentTime(status.positionMillis / 1000);

                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        setProgress(0);
                        setCurrentTime(0);
                    }
                }
            });

            setIsLoading(false);
        } catch (error) {
            console.error('Error playing voice:', error);
            setIsLoading(false);
            setIsPlaying(false);
        }
    };

    const handleSeek = async (value: number) => {
        if (!sound) return;

        try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
                const position = value * status.durationMillis;
                await sound.setPositionAsync(position);
                setProgress(value);
                setCurrentTime(position / 1000);
            }
        } catch (error) {
            console.error('Error seeking:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Pressable
                style={[styles.playButton, isFromMe && styles.playButtonMe]}
                onPress={handlePlayPause}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={isFromMe ? "#FFF" : "#EB477E"} />
                ) : (
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={20}
                        color={isFromMe ? "#FFF" : "#EB477E"}
                    />
                )}
            </Pressable>

            <View style={styles.sliderContainer}>
                <Slider
                    style={styles.slider}
                    value={progress}
                    onValueChange={(value) => {
                        setIsSeeking(true);
                        setProgress(value);
                        setCurrentTime(value * duration);
                    }}
                    onSlidingComplete={(value) => {
                        setIsSeeking(false);
                        handleSeek(value);
                    }}
                    minimumValue={0}
                    maximumValue={1}
                    minimumTrackTintColor={isFromMe ? "#FFF" : "#EB477E"}
                    maximumTrackTintColor={isFromMe ? "rgba(255,255,255,0.3)" : "rgba(235,71,126,0.2)"}
                    thumbTintColor={isFromMe ? "#FFF" : "#EB477E"}
                />
            </View>

            <Text style={[styles.timeText, isFromMe && styles.timeTextMe]}>
                {isPlaying ? formatTime(currentTime) : formatTime(duration)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(235, 71, 126, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonMe: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    sliderContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    slider: {
        width: '100%',
        height: 30,
    },
    timeText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
        minWidth: 35,
    },
    timeTextMe: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
});
