import { useEffect, useState, useRef, useCallback } from 'react';
import { InterstitialAd, AdEventType, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_INTERSTITIAL_ID, ADMOB_BANNER_ID } from '@/core/config/admob';

export const useSmartInterstitialAd = () => {
  const [interstitial, setInterstitial] = useState<InterstitialAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const hasShownRef = useRef(false);

  useEffect(() => {
    const interstitialAd = InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID);

    setIsLoading(true);

    const loadedListener = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('✅ Anuncio intersticial cargado');
        setIsLoaded(true);
        setIsLoading(false);
      }
    );

    const closedListener = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('🚪 Anuncio intersticial cerrado');
        setIsLoaded(false);
        hasShownRef.current = false;
        // Cargar otro anuncio después de cerrar
        setIsLoading(true);
        setTimeout(() => {
          interstitialAd.load();
        }, 500);
      }
    );

    setInterstitial(interstitialAd);
    interstitialAd.load();

    return () => {
      loadedListener();
      closedListener();
    };
  }, []);

  const showAd = useCallback(async () => {
    // Si el intersticial está listo, mostrarlo
    if (interstitial && isLoaded && !hasShownRef.current) {
      try {
        hasShownRef.current = true;
        await interstitial.show();
        return true;
      } catch (error) {
        console.error('❌ Error mostrando intersticial:', error);
        hasShownRef.current = false;
        // Fallback a banner modal
        console.log('🔄 Intersticial falló, usando fallback banner');
        setShowFallbackModal(true);
        return false;
      }
    }
    
    // Si el intersticial no está listo, mostrar fallback
    if (!isLoaded) {
      console.log('🔄 Intersticial no disponible, usando fallback banner');
      setShowFallbackModal(true);
      return false;
    }

    return false;
  }, [interstitial, isLoaded]);

  const closeFallback = useCallback(() => {
    setShowFallbackModal(false);
  }, []);

  return { 
    showAd, 
    isLoaded, 
    isLoading,
    showFallbackModal,
    closeFallback
  };
};
