import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ErrorModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    emoji?: string;
}

export default function ErrorModal({ visible, onClose, title, message, emoji }: ErrorModalProps) {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} style={styles.backdrop}>
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            { transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            <LinearGradient
                                colors={['#FFFFFF', '#F7FAFC']}
                                style={styles.modalContent}
                            >
                                {/* Emoji */}
                                <View style={styles.emojiContainer}>
                                    <Text style={styles.emoji}>{emoji || '😊'}</Text>
                                </View>

                                {/* Title */}
                                {title && (
                                    <Text style={styles.title}>{title}</Text>
                                )}

                                {/* Message */}
                                <Text style={styles.message}>{message}</Text>

                                {/* Button */}
                                <Pressable
                                    style={styles.button}
                                    onPress={onClose}
                                >
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.buttonText}>Entendido</Text>
                                    </LinearGradient>
                                </Pressable>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
    },
    modalContent: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    emojiContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emoji: {
        fontSize: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3748',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    button: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
