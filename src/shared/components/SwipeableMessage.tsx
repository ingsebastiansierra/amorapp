// Componente de mensaje con gesto de deslizamiento para responder
import React, { useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
    children: React.ReactNode;
    onReply: () => void;
    isFromMe: boolean;
}

export function SwipeableMessage({ children, onReply, isFromMe }: Props) {
    const translateX = useRef(new Animated.Value(0)).current;
    const replyIconOpacity = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Solo activar si desliza horizontalmente más de 10px
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 30;
            },
            onPanResponderMove: (_, gestureState) => {
                // Deslizar hacia la derecha para responder (máximo 80px)
                if (gestureState.dx > 0 && gestureState.dx < 80) {
                    translateX.setValue(gestureState.dx);
                    replyIconOpacity.setValue(gestureState.dx / 80);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Si deslizó más de 60px, activar respuesta
                if (gestureState.dx > 60) {
                    onReply();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }

                // Volver a la posición original
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();

                Animated.timing(replyIconOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* Icono de respuesta que aparece al deslizar */}
            <Animated.View
                style={[
                    styles.replyIconContainer,
                    isFromMe ? styles.replyIconRight : styles.replyIconLeft,
                    { opacity: replyIconOpacity }
                ]}
            >
                <Ionicons name="arrow-undo" size={20} color="#667eea" />
            </Animated.View>

            <Animated.View
                style={[
                    styles.messageWrapper,
                    { transform: [{ translateX }] }
                ]}
                {...panResponder.panHandlers}
            >
                {children}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: 16,
    },
    replyIconContainer: {
        position: 'absolute',
        top: '50%',
        marginTop: -10,
        zIndex: 0,
    },
    replyIconLeft: {
        left: 10,
    },
    replyIconRight: {
        right: 10,
    },
    messageWrapper: {
        zIndex: 1,
    },
});
