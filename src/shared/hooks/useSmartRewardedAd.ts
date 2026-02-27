// ⚠️ ADMOB DESHABILITADO - Hook dummy
import { useCallback } from 'react';

export const useSmartRewardedAd = (onReward: () => void) => {
    const showAd = useCallback(() => {
        // Otorga la recompensa inmediatamente mientras AdMob está deshabilitado
        console.log('⚠️ AdMob deshabilitado - Recompensa otorgada sin anuncio');
        onReward();
    }, [onReward]);

    return {
        isLoaded: true, // Siempre "cargado" para que funcione el flujo
        isLoading: false,
        showAd,
        showFallback: () => {}, // No hace nada
    };
};
