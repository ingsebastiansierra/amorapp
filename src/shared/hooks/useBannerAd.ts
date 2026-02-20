import { useEffect, useState } from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

export const useBannerAd = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return {
    isLoaded,
    BannerAdSize,
  };
};
