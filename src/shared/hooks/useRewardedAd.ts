import { useEffect, useState, useRef, useCallback } from 'react';
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { ADMOB_REWARDED_ID } from '@/core/config/admob';

export const useRewardedAd = (onReward: () => void) => {
  const [rewarded, setRewarded] = useState<RewardedAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const onRewardRef = useRef(onReward);

  useEffect(() => {
    onRewardRef.current = onReward;
  }, [onReward]);

  useEffect(() => {
    const rewardedAd = RewardedAd.createForAdRequest(ADMOB_REWARDED_ID);
    setIsLoading(true);

    const loadedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('✅ Anuncio cargado y listo');
        setIsLoaded(true);
        setIsLoading(false);
      }
    );

    const earnedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        console.log('🎁 Recompensa ganada');
        onRewardRef.current();
        // Precargar el siguiente anuncio después de ganar la recompensa
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

  const showAd = useCallback(async () => {
    if (rewarded && isLoaded) {
      try {
        await rewarded.show();
      } catch (error) {
        console.error('❌ Error mostrando anuncio:', error);
        setIsLoaded(false);
        setIsLoading(true);
        // Intentar cargar otro anuncio
        if (rewarded) {
          setTimeout(() => {
            rewarded.load();
          }, 1000);
        }
      }
    }
  }, [rewarded, isLoaded]);

  return { showAd, isLoaded, isLoading };
};
