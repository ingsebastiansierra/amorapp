// ⚠️ ADMOB DESHABILITADO - Componente dummy
import React from 'react';

export const HomeBannerAd = () => {
    // No renderiza nada mientras AdMob está deshabilitado
    return null;
};

/* VERSIÓN ORIGINAL (RESTAURAR CUANDO SE HABILITE ADMOB)
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_ID } from '@/core/config/admob';

export const HomeBannerAd = () => {
    return (
        <View style={styles.container}>
            <BannerAd
                unitId={ADMOB_BANNER_ID}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 10,
    },
});
*/
