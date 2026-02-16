// Botón de grabación de voz estilo WhatsApp
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Animated, PanResponder } from 'react-native';
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
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const { sendVoiceNote } = useVoiceNotes();

    const slideX = useRef(new Animated.Value(0)).current;
    const recordingUri = useRef<string | null>(null);
    const durationRef = useRef(0);
    const isRecordingRef = useRef(false);

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
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Si deslizó más de 100px a la izquierda, cancelar
                if (gestureState.dx < -100) {
                    handleCancelRecording();
                } else {
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
        let waveInterval: NodeJS.Timeout;

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

            // Generar forma de onda simulada (barras que suben y bajan)
            waveInterval = setInterval(() => {
                setWaveformData(prev => {
                    const newData = [...prev];
                    // Agregar nueva barra con altura aleatoria
                    newData.push(Math.random() * 40 + 10);
                    // Mantener solo las últimas 30 barras
                    if (newData.length > 30) {
                        newData.shift();
                    }
                    return newData;
                });
            }, 100);
        } else {
            durationRef.current = 0;
            setDuration(0);
            setWaveformData([]);
            slideX.setValue(0);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (waveInterval) clearInterval(waveInterval);
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
        try {
            const { uri, duration: recordedDuration } = await voiceService.stopRecording();
            const actualDuration = durationRef.current; // Usar el contador interno

            console.log('🎤 Grabación detenida:', {
                recordedDuration,
                actualDuration,
                uri
            });

            recordingUri.current = uri;
            setIsRecording(false);
            isRecordingRef.current = false;

            // Usar el contador interno que es más confiable
            if (actualDuration < 1) {
                Alert.alert('Muy corto', 'La nota debe durar al menos 1 segundo');
                return;
            }

            // Enviar automáticamente con la duración del contador
            await sendVoiceNote(toUserId, uri, actualDuration, {
                waveformData: waveformData.length > 0 ? waveformData : undefined
            });

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
                        { transform: [{ translateX: slideX }] }
                    ]}
                >
                    <View
                        style={styles.swipeArea}
                        {...panResponder.panHandlers}
                    >
                        {/* Indicador de grabación */}
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                        </View>

                        {/* Duración */}
                        <Text style={styles.durationText}>{formatDuration(duration)}</Text>

                        {/* Forma de onda animada */}
                        <View style={styles.waveformContainer}>
                            {waveformData.slice(-20).map((height, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.waveformBar,
                                        {
                                            height: Math.max(height * 0.6, 6),
                                            opacity: 0.5 + (index / 20) * 0.5
                                        }
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Hint de deslizar */}
                        <Text style={styles.slideHint}>← Desliza</Text>
                    </View>

                    {/* Botón de enviar - FUERA del PanResponder */}
                    <Pressable
                        onPress={handleStopRecording}
                        style={styles.sendButton}
                    >
                        <Text style={styles.sendIcon}>▶</Text>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    return (
        <Pressable
            onPress={handleStartRecording}
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
        width: '100%',
    },
    recordingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 25,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    swipeArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    recordingIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
    },
    durationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A202C',
        minWidth: 38,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        gap: 2,
        flex: 1,
        paddingHorizontal: 4,
    },
    waveformBar: {
        width: 2.5,
        backgroundColor: '#007AFF',
        borderRadius: 1.5,
        minHeight: 6,
    },
    slideHint: {
        fontSize: 11,
        color: '#718096',
        marginRight: 4,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: {
        fontSize: 18,
        color: '#FFF',
    },
});
