import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HeartButton } from '@shared/components/HeartButton';
import { EmotionalStateSelector } from '@shared/components/EmotionalStateSelector';
import { useEmotionalStore } from '@core/store/useEmotionalStore';
import { EmotionalState, EMOTIONAL_STATES } from '@core/types/emotions';

export const HomeScreen: React.FC = () => {
    const { myState, partnerState, setMyState } = useEmotionalStore();
    const [showStateSelector, setShowStateSelector] = useState(false);

    const handleHeartPress = () => {

    };

    const handleHeartLongPress = (duration: number) => {

    };

    const handleStateSelect = async (state: EmotionalState) => {
        await setMyState(state, 1);
        setShowStateSelector(false);
    };

    const myStateConfig = myState ? EMOTIONAL_STATES[myState] : null;
    const partnerStateConfig = partnerState ? EMOTIONAL_STATES[partnerState] : null;

    return (
        <LinearGradient
            colors={myStateConfig?.gradient || ['#667eea', '#764ba2']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Animated.View style={{ opacity: 1 }}>
                        <Text style={styles.partnerStatus}>
                            {partnerStateConfig
                                ? `${partnerStateConfig.emoji} ${partnerStateConfig.label}`
                                : '🤍 Esperando...'}
                        </Text>
                    </Animated.View>
                </View>

                <View style={styles.centerContent}>
                    <HeartButton
                        onPress={handleHeartPress}
                        onLongPress={handleHeartLongPress}
                        color={myStateConfig?.color}
                    />
                </View>

                <View style={styles.footer}>
                    {showStateSelector ? (
                        <EmotionalStateSelector
                            selectedState={myState}
                            onSelectState={handleStateSelect}
                        />
                    ) : (
                        <Text
                            style={styles.changeStateButton}
                            onPress={() => setShowStateSelector(true)}
                        >
                            {myStateConfig
                                ? `${myStateConfig.emoji} ${myStateConfig.label}`
                                : 'Selecciona tu estado'}
                        </Text>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    partnerStatus: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFF',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 20,
    },
    changeStateButton: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        textAlign: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
});
