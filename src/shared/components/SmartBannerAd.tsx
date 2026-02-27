// ⚠️ ADMOB DESHABILITADO - Componente dummy
import React from 'react';

interface SmartBannerAdProps {
    onAdLoaded?: () => void;
    onAdFailedToLoad?: () => void;
}

export const SmartBannerAd: React.FC<SmartBannerAdProps> = () => {
    // No renderiza nada mientras AdMob está deshabilitado
    return null;
};
