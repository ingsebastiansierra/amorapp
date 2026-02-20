import { useEffect, useState, useRef, useCallback } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { ADMOB_INTERSTITIAL_ID } from '@/core/config/admob';

export const useInterstitialAd = () => {
  const [interstitial, setInterstitial] = useState<InterstitialAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    if (interstitial && isLoaded && !hasShownRef.current) {
      try {
        hasShownRef.current = true;
        await interstitial.show();
      } catch (error) {
        console.error('❌ Error mostrando anuncio intersticial:', error);
        hasShownRef.current = false;
        // Intentar cargar otro anuncio
        if (interstitial) {
          setIsLoading(true);
          setTimeout(() => {
            interstitial.load();
          }, 1000);
        }
      }
    }
  }, [interstitial, isLoaded]);

  return { showAd, isLoaded, isLoading };
};
