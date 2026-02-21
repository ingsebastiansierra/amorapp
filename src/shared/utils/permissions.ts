// Utilidades para manejo de permisos
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

export const requestAudioPermissions = async (): Promise<boolean> => {
  try {
    console.log('🎤 Solicitando permisos de audio...');
    
    const { status } = await Audio.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('⚠️ Permiso de audio denegado');
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos acceso al micrófono para grabar mensajes de voz. Por favor, activa el permiso en la configuración de tu dispositivo.',
        [{ text: 'Entendido' }]
      );
      return false;
    }
    
    console.log('✅ Permisos de audio concedidos');
    return true;
  } catch (error) {
    console.error('❌ Error solicitando permisos de audio:', error);
    Alert.alert(
      'Error',
      'No se pudo solicitar el permiso del micrófono. Intenta de nuevo.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    console.log('📷 Solicitando permisos de cámara...');
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('⚠️ Permiso de cámara denegado');
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos acceso a la cámara para tomar fotos. Por favor, activa el permiso en la configuración de tu dispositivo.',
        [{ text: 'Entendido' }]
      );
      return false;
    }
    
    console.log('✅ Permisos de cámara concedidos');
    return true;
  } catch (error) {
    console.error('❌ Error solicitando permisos de cámara:', error);
    return false;
  }
};

export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    console.log('🖼️ Solicitando permisos de galería...');
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('⚠️ Permiso de galería denegado');
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos acceso a tu galería para seleccionar fotos. Por favor, activa el permiso en la configuración de tu dispositivo.',
        [{ text: 'Entendido' }]
      );
      return false;
    }
    
    console.log('✅ Permisos de galería concedidos');
    return true;
  } catch (error) {
    console.error('❌ Error solicitando permisos de galería:', error);
    return false;
  }
};

export const initializeAudio = async (): Promise<boolean> => {
  try {
    console.log('🔊 Inicializando sistema de audio...');
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    console.log('✅ Sistema de audio inicializado');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando audio:', error);
    return false;
  }
};
