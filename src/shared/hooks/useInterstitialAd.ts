// ⚠️ ADMOB DESHABILITADO - Hook dummy
import { useCallback } from 'react';

export const useInterstitialAd = () => {
    const showAd = useCallback(() => {
        // No hace nada mientras AdMob está deshabilitado
        console.log('⚠️ AdMob deshabilitado - Intersticial no mostrado');
    }, []);

    return {
        isLoaded: false,
        isLoading: false,
        showAd,
    };
};
