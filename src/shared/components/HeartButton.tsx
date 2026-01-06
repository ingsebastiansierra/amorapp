import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface HeartButtonProps {
    onPress: () => void;
    onLongPress: (duration: number) => void;
    color?: string;
}

export const HeartButton: React.FC<HeartButtonProps> = ({
    onPress,
    onLongPress,
    color = '#FF6B9D',
}) => {
    const scale = useSharedValue(1);
    const pressStartTime = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        pressStartTime.value = Date.now();
        scale.value = withSpring(0.9);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handlePressOut = useCallback(() => {
        const duration = Date.now() - pressStartTime.value;
        scale.value = withSequence(
            withSpring(1.2),
            withSpring(1)
        );

        if (duration > 500) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onLongPress(duration);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
        }
    }, [onPress, onLongPress]);

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={[styles.heart, animatedStyle, { backgroundColor: color }]}>
                <Animated.Text style={styles.heartEmoji}>❤️</Animated.Text>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    heart: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    heartEmoji: {
        fontSize: 48,
    },
});
