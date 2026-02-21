import { useEffect, useState, useRef, useCallback } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { ADMOB_INTERSTITIAL_ID } from '@/core/config/admob';

export const useSmartInterstitialAd = () => {
  const [interstitial, setInterstitial] = useState<InterstitialAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const hasShownRef = useRef(false);

  useEffect(() => {
    console.log('🎬 Inicializando anuncio intersticial con ID:', ADMOB_INTERSTITIAL_ID);
    const interstitialAd = InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

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
          try {
            interstitialAd.load();
          } catch (error) {
            console.error('❌ Error recargando intersticial:', error);
            setIsLoading(false);
          }
        }, 1000);
      }
    );

    setInterstitial(interstitialAd);
    
    // Cargar el anuncio
    try {
      interstitialAd.load();
    } catch (error) {
      console.error('❌ Error cargando intersticial:', error);
      setIsLoading(false);
    }

    return () => {
      loadedListener();
      closedListener();
    };
  }, []);

  const showAd = useCallback(async () => {
    console.log('🎯 Intentando mostrar anuncio intersticial...', { isLoaded, hasShown: hasShownRef.current });
    
    // Si el intersticial está listo, mostrarlo
    if (interstitial && isLoaded && !hasShownRef.current) {
      try {
        hasShownRef.current = true;
        await interstitial.show();
        console.log('✅ Anuncio intersticial mostrado');
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
      console.log('⏳ Intersticial no disponible, usando fallback banner');
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
