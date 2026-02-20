import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_ID } from '@/core/config/admob';
import { Ionicons } from '@expo/vector-icons';

// Usamos un Banner MEDIUM_RECTANGLE que funciona como Native Ad
export const GalleryNativeAd = () => {
    return (
        <View style={styles.container}>
            {/* Badge de "Patrocinado" */}
            <View style={styles.sponsoredBadge}>
                <Ionicons name="megaphone" size={10} color="#9CA3AF" />
                <Text style={styles.sponsoredText}>Patrocinado</Text>
            </View>

            {/* Banner adaptativo que se comporta como Native */}
            <BannerAd
                unitId={ADMOB_BANNER_ID}
                size={BannerAdSize.MEDIUM_RECTANGLE}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                    console.log('✅ Anuncio de galería cargado');
                }}
                onAdFailedToLoad={(error) => {
                    console.log('❌ Anuncio de galería falló:', error);
                }}
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
