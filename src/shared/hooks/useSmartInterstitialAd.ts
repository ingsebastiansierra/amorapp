// ⚠️ ADMOB DESHABILITADO - Hook dummy
import { useCallback } from 'react';

export const useSmartInterstitialAd = () => {
    const showAd = useCallback(() => {
        // No hace nada mientras AdMob está deshabilitado
        console.log('⚠️ AdMob deshabilitado - Smart Intersticial no mostrado');
    }, []);

    return {
        isLoaded: false,
        isLoading: false,
        showAd,
    };
};
