// Configuración de AdMob
// En desarrollo usa IDs de prueba de Google
// En producción usa tus IDs reales

const IS_DEV = __DEV__;

// ✅ ANUNCIOS REALES ACTIVADOS
// Cambia USE_TEST_ADS a true si quieres volver a usar IDs de prueba
const USE_TEST_ADS = false;

export const ADMOB_REWARDED_ID = (IS_DEV || USE_TEST_ADS)
  ? 'ca-app-pub-3940256099942544/5224354917' // ID de prueba de Google
  : 'ca-app-pub-6948900650863718/8071676377'; // ID real - Recompensas Premium

export const ADMOB_INTERSTITIAL_ID = (IS_DEV || USE_TEST_ADS)
  ? 'ca-app-pub-3940256099942544/1033173712' // ID de prueba de Google
  : 'ca-app-pub-6948900650863718/2854203030'; // ID real - Intersticial Ocasional

export const ADMOB_BANNER_ID = (IS_DEV || USE_TEST_ADS)
  ? 'ca-app-pub-3940256099942544/6300978111' // ID de prueba de Google
  : 'ca-app-pub-6948900650863718/2740865061'; // ID real - Banner Perfil

export const ADMOB_NATIVE_ID = (IS_DEV || USE_TEST_ADS)
  ? 'ca-app-pub-3940256099942544/2247696110' // ID de prueba de Google
  : 'ca-app-pub-6948900650863718/8661336338'; // ID real - Native Galería Fotos
