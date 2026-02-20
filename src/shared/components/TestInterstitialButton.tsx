import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useInterstitialAd } from '@/shared/hooks/useInterstitialAd';

export const TestInterstitialButton = () => {
    const { showAd, isLoaded, isLoading } = useInterstitialAd();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, !isLoaded && styles.buttonDisabled]}
                onPress={showAd}
                disabled={!isLoaded}
            >
                <Text style={styles.buttonText}>
                    {isLoading ? '⏳ Cargando anuncio...' : isLoaded ? '📺 Mostrar Anuncio Intersticial' : '❌ Anuncio no disponible'}
                </Text>
            </TouchableOpacity>
            <Text style={styles.status}>
                Estado: {isLoading ? 'Cargando...' : isLoaded ? 'Listo ✅' : 'No cargado ❌'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#FF6B9D',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        minWidth: 250,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    status: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
});
