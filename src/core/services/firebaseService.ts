import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Firebase solo funciona en builds nativos, no en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

class FirebaseService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized || isExpoGo) {
      console.log('⚠️ Firebase no disponible en Expo Go');
      return;
    }

    // Firebase se inicializará automáticamente cuando hagas un build nativo
    // Por ahora, solo registramos que está listo
    this.initialized = true;
    console.log('✅ Firebase listo para build nativo');
  }

  async getToken(): Promise<string | null> {
    if (isExpoGo) return null;
    
    // En un build nativo, aquí obtendrías el token FCM
    console.log('⚠️ FCM token solo disponible en build nativo');
    return null;
  }

  onTokenRefresh(callback: (token: string) => void): () => void {
    return () => {};
  }

  onMessage(callback: (message: any) => void): () => void {
    return () => {};
  }
}

export const firebaseService = new FirebaseService();
