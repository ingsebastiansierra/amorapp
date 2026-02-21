import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_ID, ADMOB_NATIVE_ID } from '@/core/config/admob';
import { Ionicons } from '@expo/vector-icons';

export const SmartGalleryAd = () => {
    const [currentAttempt, setCurrentAttempt] = useState(0);
    const [failedAll, setFailedAll] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fallback chain: Native -> Medium Rectangle -> Banner
    const fallbackOptions = [
        { id: ADMOB_NATIVE_ID, size: BannerAdSize.MEDIUM_RECTANGLE, label: 'Native' },
        { id: ADMOB_BANNER_ID, size: BannerAdSize.MEDIUM_RECTANGLE, label: 'Medium Rectangle' },
        { id: ADMOB_BANNER_ID, size: BannerAdSize.BANNER, label: 'Banner' },
    ];

    // Timeout para evitar que se quede cargando indefinidamente
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                console.log('⏱️ Timeout de anuncio de galería, ocultando...');
                setFailedAll(true);
            }
        }, 10000); // 10 segundos

        return () => clearTimeout(timeout);
    }, [isLoading, currentAttempt]);

    const handleAdFail = (error: any) => {
        console.log(`⚠️ Anuncio galería intento ${currentAttempt + 1} (${fallbackOptions[currentAttempt].label}) falló:`, error.message);

        if (currentAttempt < fallbackOptions.length - 1) {
            // Intentar siguiente opción
            setCurrentAttempt(currentAttempt + 1);
            setIsLoading(true);
        } else {
            // Todos los intentos fallaron
            console.log('❌ Todos los anuncios de galería fallaron - ocultando');
            setFailedAll(true);
            setIsLoading(false);
        }
    };

    const handleAdLoaded = () => {
        console.log(`✅ Anuncio de galería cargado (${fallbackOptions[currentAttempt].label})`);
        setIsLoading(false);
    };

    // No mostrar nada si todos fallan
    if (failedAll) {
        return null;
    }

    const currentOption = fallbackOptions[currentAttempt];

    return (
        <View style={styles.container}>
            {/* Badge de "Patrocinado" */}
            <View style={styles.sponsoredBadge}>
                <Ionicons name="megaphone" size={10} color="#9CA3AF" />
                <Text style={styles.sponsoredText}>Patrocinado</Text>
            </View>

            {/* Banner adaptativo */}
            <BannerAd
                unitId={currentOption.id}
                size={currentOption.size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={handleAdLoaded}
                onAdFailedToLoad={handleAdFail}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
        paddingHorizontal: 4,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        paddingVertical: 8,
        alignItems: 'center',
    },
    sponsoredBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        zIndex: 10,
    },
    sponsoredText: {
        fontSize: 9,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
