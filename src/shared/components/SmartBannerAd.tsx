import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_ID } from '@/core/config/admob';

interface SmartBannerAdProps {
    size?: BannerAdSize;
}

export const SmartBannerAd: React.FC<SmartBannerAdProps> = ({
    size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER
}) => {
    const [currentAttempt, setCurrentAttempt] = useState(0);
    const [failedAll, setFailedAll] = useState(false);

    // Fallback chain: Adaptive Banner -> Regular Banner -> Small Banner
    const fallbackSizes = [
        BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
        BannerAdSize.BANNER,
        BannerAdSize.LARGE_BANNER,
    ];

    const handleAdFail = (error: any) => {
        console.log(`⚠️ Banner intento ${currentAttempt + 1} falló:`, error.message);

        if (currentAttempt < fallbackSizes.length - 1) {
            // Intentar siguiente tamaño
            setCurrentAttempt(currentAttempt + 1);
        } else {
            // Todos los intentos fallaron
            console.log('❌ Todos los banners fallaron');
            setFailedAll(true);
        }
    };

    if (failedAll) {
        return null; // No mostrar nada si todos fallan
    }

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={ADMOB_BANNER_ID}
                size={fallbackSizes[currentAttempt]}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                    console.log(`✅ Banner cargado (intento ${currentAttempt + 1})`);
                }}
                onAdFailedToLoad={handleAdFail}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
});
