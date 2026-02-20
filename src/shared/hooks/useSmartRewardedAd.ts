import { useEffect, useState, useRef, useCallback } from 'react';
import { RewardedAd, RewardedAdEventType, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { ADMOB_REWARDED_ID, ADMOB_INTERSTITIAL_ID } from '@/core/config/admob';
import { Alert } from 'react-native';

export const useSmartRewardedAd = (onReward: () => void) => {
  const [rewarded, setRewarded] = useState<RewardedAd | null>(null);
  const [interstitialFallback, setInterstitialFallback] = useState<InterstitialAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rewardedFailed, setRewardedFailed] = useState(false);
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const onRewardRef = useRef(onReward);

  useEffect(() => {
    onRewardRef.current = onReward;
  }, [onReward]);

  // Cargar anuncio recompensado (primario)
  useEffect(() => {
    const rewardedAd = RewardedAd.createForAdRequest(ADMOB_REWARDED_ID);
    setIsLoading(true);

    const loadedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('✅ Anuncio recompensado cargado');
        setIsLoaded(true);
        setIsLoading(false);
        setRewardedFailed(false);
      }
    );

    const earnedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        console.log('🎁 Recompensa ganada');
        onRewardRef.current();
        // Precargar el siguiente anuncio
        setIsLoaded(false);
        setIsLoading(true);
        setTimeout(() => {
          rewardedAd.load();
        }, 500);
      }
    );

    setRewarded(rewardedAd);
    rewardedAd.load();

    return () => {
      loadedListener();
      earnedListener();
    };
  }, []);

  // Cargar intersticial como fallback
  useEffect(() => {
    if (rewardedFailed) {
      console.log('🔄 Cargando intersticial como fallback...');
      const interstitialAd = InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID);

      const loadedListener = interstitialAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
          console.log('✅ Intersticial fallback cargado');
          setFallbackLoaded(true);
        }
      );

      const closedListener = interstitialAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('🚪 Intersticial fallback cerrado, otorgando recompensa');
          // Otorgar recompensa de todos modos
          onRewardRef.current();
          setFallbackLoaded(false);
        }
      );

      setInterstitialFallback(interstitialAd);
      interstitialAd.load();

      return () => {
        loadedListener();
        closedListener();
      };
    }
  }, [rewardedFailed]);

  const showAd = useCallback(async () => {
    // Intentar mostrar anuncio recompensado primero
    if (rewarded && isLoaded) {
      try {
        await rewarded.show();
        return true;
      } catch (error) {
        console.error('❌ Error mostrando recompensado:', error);
        setRewardedFailed(true);
        
        // Si falla, intentar intersticial
        if (interstitialFallback && fallbackLoaded) {
          try {
            console.log('🔄 Mostrando intersticial como fallback');
            Alert.alert(
              'Anuncio Alternativo',
              'El anuncio recompensado no está disponible. Te mostraremos un anuncio alternativo y recibirás tu recompensa.',
              [
                {
                  text: 'Ver Anuncio',
                  onPress: async () => {
                    await interstitialFallback.show();
                  }
                },
                {
                  text: 'Cancelar',
                  style: 'cancel'
                }
              ]
            );
            return true;
          } catch (fallbackError) {
            console.error('❌ Error mostrando fallback:', fallbackError);
            // Otorgar recompensa de todos modos
            Alert.alert(
              'Sin Anuncios Disponibles',
              'No hay anuncios disponibles en este momento. ¡Te daremos la recompensa de todos modos!',
              [
                {
                  text: 'Gracias',
                  onPress: () => onRewardRef.current()
                }
              ]
            );
            return false;
          }
        } else {
          // No hay fallback disponible, otorgar recompensa
          Alert.alert(
            'Sin Anuncios',
            'No hay anuncios disponibles. ¡Disfruta tu recompensa!',
            [
              {
                text: 'Gracias',
                onPress: () => onRewardRef.current()
              }
            ]
          );
          return false;
        }
      }
    }

    // Si el anuncio no está cargado
    if (!isLoaded) {
      Alert.alert(
        'Cargando Anuncio',
        'El anuncio se está cargando. Por favor espera un momento.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return false;
  }, [rewarded, isLoaded, rewardedFailed, interstitialFallback, fallbackLoaded]);

  return { 
    showAd, 
    isLoaded: isLoaded || fallbackLoaded, 
    isLoading 
  };
};
