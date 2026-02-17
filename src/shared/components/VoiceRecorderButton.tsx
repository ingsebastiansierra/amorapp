// Botón de grabación de voz estilo WhatsApp
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voiceService } from '@/core/services/voiceService';
import { useVoiceNotes } from '../hooks/useVoiceNotes';
import * as Haptics from 'expo-haptics';

interface Props {
    toUserId: string;
    onSent?: () => void;
    size?: number;
    color?: string;
}

export function VoiceRecorderButton({ toUserId, onSent, size = 28, color = '#007AFF' }: Props) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const { sendVoiceNote } = useVoiceNotes();

    const slideX = useRef(new Animated.Value(0)).current;
    const durationRef = useRef(0);
    const isRecordingRef = useRef(false);
    const isCancelled = useRef(false);

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            if (isRecordingRef.current) {
                voiceService.cancelRecording().catch(() => { });
            }
        };
    }, []);

    // PanResponder para detectar deslizamiento
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                // Solo permitir deslizar hacia la izquierda
                if (gestureState.dx < 0) {
                    slideX.setValue(gestureState.dx);
                    // Si deslizó más de 80px, marcar como cancelado
                    if (gestureState.dx < -80) {
                        isCancelled.current = true;
                    }
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Si deslizó más de 80px a la izquierda, cancelar
                if (gestureState.dx < -80) {
                    handleCancelRecording();
                } else {
                    isCancelled.current = false;
                    // Volver a la posición original
                    Animated.spring(slideX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRecording) {
            // Contador de duración
            interval = setInterval(() => {
                durationRef.current += 1;
                setDuration(durationRef.current);

                // Detener automáticamente a los 30 segundos
                if (durationRef.current >= 30) {
                    handleStopRecording();
                }
            }, 1000);
        } else {
            durationRef.current = 0;
            setDuration(0);
            slideX.setValue(0);
            isCancelled.current = false;
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    const handleStartRecording = async () => {
        try {
            // Solicitar permisos
            const hasPermission = await voiceService.requestPermissions();
            if (!hasPermission) {
                Alert.alert('Permisos necesarios', 'Necesitamos acceso al micrófono');
                return;
            }

            await voiceService.startRecording();
            setIsRecording(true);
            isRecordingRef.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.error('Error starting recording:', error);
            Alert.alert('Error', 'No se pudo iniciar la grabación');
            setIsRecording(false);
            isRecordingRef.current = false;
        }
    };

    const handleStopRecording = async () => {
        // Si fue cancelado por deslizar, no enviar
        if (isCancelled.current) {
            await handleCancelRecording();
            return;
        }

        try {
            const { uri } = await voiceService.stopRecording();
            const actualDuration = durationRef.current;

            setIsRecording(false);
            isRecordingRef.current = false;

            if (actualDuration < 1) {
                Alert.alert('Muy corto', 'La nota debe durar al menos 1 segundo');
                return;
            }

            // Enviar sin waveform
            await sendVoiceNote(toUserId, uri, actualDuration);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSent?.();
        } catch (error) {
            console.error('Error stopping recording:', error);
            Alert.alert('Error', 'No se pudo enviar la nota de voz');
            setIsRecording(false);
            isRecordingRef.current = false;
        }
    };

    const handleCancelRecording = async () => {
        try {
            await voiceService.cancelRecording();
            setIsRecording(false);
            isRecordingRef.current = false;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (error) {
            console.error('Error canceling recording:', error);
            setIsRecording(false);
            isRecordingRef.current = false;
        }
    };



    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isRecording) {
        return (
            <View style={styles.recordingWrapper}>
                <Animated.View
                    style={[
                        styles.recordingContainer,
                        {
                            transform: [{ translateX: slideX }],
                            opacity: slideX.interpolate({
                                inputRange: [-100, 0],
                                outputRange: [0.3, 1],
                            })
                        }
                    ]}
                >
                    {/* Área deslizable */}
                    <View style={styles.swipeArea} {...panResponder.panHandlers}>
                        {/* Indicador de grabación */}
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                        </View>

                        {/* Duración */}
                        <Text style={styles.durationText}>{formatDuration(duration)}</Text>

                        {/* Hint de deslizar para cancelar */}
                        <Text style={styles.slideHint}>← Desliza para cancelar</Text>
                    </View>

                    {/* Botón de enviar - FUERA del PanResponder */}
                    <Pressable
                        onPress={handleStopRecording}
                        style={styles.sendButton}
                    >
                        <Ionicons name="send" size={18} color="#FFF" />
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    return (
        <Pressable
            onPressIn={handleStartRecording}
            onPressOut={handleStopRecording}
            style={[styles.button, { width: size + 8, height: size + 8 }]}
        >
            <Text style={[styles.icon, { fontSize: size, color }]}>🎤</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    icon: {
        fontSize: 28,
    },
    recordingWrapper: {
        position: 'absolute',
        right: 0,
        minWidth: 280,
    },
    recordingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    swipeArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    recordingIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
    },
    durationText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A202C',
        minWidth: 45,
    },
    slideHint: {
        fontSize: 12,
        color: '#718096',
        flex: 1,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EB477E',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
