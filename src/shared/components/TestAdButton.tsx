import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRewardedAd } from '@/shared/hooks/useRewardedAd';

export const TestAdButton = () => {
    const handleReward = useCallback(() => {
        Alert.alert('¡Recompensa!', 'Viste el anuncio completo');
    }, []);

    const { showAd, isLoaded } = useRewardedAd(handleReward);

    return (
        <TouchableOpacity
            style={[styles.button, !isLoaded && styles.disabled]}
            onPress={showAd}
            disabled={!isLoaded}
        >
            <Text style={styles.text}>
                {isLoaded ? '🎁 Ver Anuncio de Prueba' : 'Cargando...'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#FF6B9D',
        padding: 16,
        borderRadius: 12,
        margin: 20,
    },
    disabled: {
        backgroundColor: '#CCC',
    },
    text: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});
