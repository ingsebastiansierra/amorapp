import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { EmotionalState, EMOTIONAL_STATES } from '@core/types/emotions';

interface EmotionalStateSelectorProps {
    selectedState: EmotionalState | null;
    onSelectState: (state: EmotionalState) => void;
}

export const EmotionalStateSelector: React.FC<EmotionalStateSelectorProps> = ({
    selectedState,
    onSelectState,
}) => {
    const animations = useRef(
        Object.keys(EMOTIONAL_STATES).map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        // Animación de entrada escalonada
        const animationSequence = animations.map((anim, index) =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                delay: index * 50,
                useNativeDriver: true,
            })
        );
        Animated.parallel(animationSequence).start();
    }, []);

    const handleSelect = (state: EmotionalState) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelectState(state);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>¿Cómo te sientes?</Text>
            <View style={styles.grid}>
                {Object.entries(EMOTIONAL_STATES).map(([key, config], index) => {
                    const isSelected = selectedState === key;
                    const scale = animations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                    });
                    const opacity = animations[index];

                    return (
                        <Animated.View
                            key={key}
                            style={{
                                opacity,
                                transform: [{ scale }],
                            }}
                        >
                            <Pressable onPress={() => handleSelect(key as EmotionalState)}>
                                <LinearGradient
                                    colors={config.gradient}
                                    style={[
                                        styles.stateButton,
                                        isSelected && styles.stateButtonSelected,
                                    ]}
                                >
                                    <Text style={styles.emoji}>{config.emoji}</Text>
                                    <Text style={styles.label}>{config.label}</Text>
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>
                    );
                })}
            </View>
            <Text style={styles.hint}>Toca un estado para seleccionarlo</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 40,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 360,
    },
    stateButton: {
        width: 100,
        height: 100,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 6,
    },
    stateButtonSelected: {
        borderWidth: 4,
        borderColor: '#FFF',
    },
    emoji: {
        fontSize: 36,
        marginBottom: 4,
    },
    label: {
        fontSize: 11,
        color: '#FFF',
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    hint: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.8,
        marginTop: 30,
        textAlign: 'center',
    },
});
