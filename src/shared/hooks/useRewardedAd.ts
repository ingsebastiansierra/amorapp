import { useEffect, useState, useRef, useCallback } from 'react';
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { ADMOB_REWARDED_ID } from '@/core/config/admob';

export const useRewardedAd = (onReward: () => void) => {
  const [rewarded, setRewarded] = useState<RewardedAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const onRewardRef = useRef(onReward);

  useEffect(() => {
    onRewardRef.current = onReward;
  }, [onReward]);

  useEffect(() => {
    const rewardedAd = RewardedAd.createForAdRequest(ADMOB_REWARDED_ID);

    const loadedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setIsLoaded(true)
    );

    const earnedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => onRewardRef.current()
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
      await rewarded.show();
      setIsLoaded(false);
      rewarded.load();
    }
  }, [rewarded, isLoaded]);

  return { showAd, isLoaded };
};
