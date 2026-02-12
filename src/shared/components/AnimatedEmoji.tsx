import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface AnimatedEmojiProps {
    emoji: string;
    size?: number;
    animate?: boolean;
}

export const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
    emoji,
    size = 56,
    animate = true
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animate) {
            // Animación de entrada con rebote
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Animación de rotación sutil
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: -1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Animación de rebote continuo
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceAnim, {
                        toValue: -5,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            scaleAnim.setValue(1);
        }
    }, [emoji, animate]);

    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-10deg', '10deg'],
    });

    return (
        <Animated.Text
            style={[
                styles.emoji,
                {
                    fontSize: size,
                    transform: [
                        { scale: scaleAnim },
                        { rotate: rotate },
                        { translateY: bounceAnim },
                    ],
                },
            ]}
        >
            {emoji}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    emoji: {
        textAlign: 'center',
    },
});
