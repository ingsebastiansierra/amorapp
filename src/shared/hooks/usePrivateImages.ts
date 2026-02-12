// Hook para manejar imágenes privadas
import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useMediaStore } from '@/core/store/useMediaStore';
import { mediaService } from '@/core/services/mediaService';
import { useAuthStore } from '@/core/store/useAuthStore';
import { SendPrivateImageOptions } from '@/core/types/media';

export function usePrivateImages() {
  const user = useAuthStore((state) => state.user);
  const {
    pendingImages,
    viewedImages,
    isLoading,
    setPendingImages,
    addPendingImage,
    markImageAsViewed,
    removeImage,
    setLoading,
  } = useMediaStore();

  // Cargar imágenes pendientes al montar
  useEffect(() => {
    if (user?.id) {
      loadPendingImages();
    }
  }, [user?.id]);

  // Suscribirse a nuevas imágenes en tiempo real
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = mediaService.subscribeToNewImages(user.id, (newImage) => {
      addPendingImage(newImage);
      
      // Mostrar notificación
      Alert.alert(
        '📸 Nueva imagen privada',
        newImage.caption || 'Tu pareja te envió una imagen',
        [{ text: 'Ver después' }, { text: 'Ver ahora', onPress: () => {} }]
      );
    });

    return unsubscribe;
  }, [user?.id]);

  const loadPendingImages = useCallback(async () => {
    try {
      setLoading(true);
      const images = await mediaService.getPendingImages();
      setPendingImages(images);
    } catch (error) {

      Alert.alert('Error', 'No se pudieron cargar las imágenes');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendImage = useCallback(
    async (toUserId: string, imageUri: string, options?: SendPrivateImageOptions) => {
      try {
        setLoading(true);
        await mediaService.sendPrivateImage(toUserId, imageUri, options);
        Alert.alert('✅ Enviado', 'Imagen enviada correctamente');
      } catch (error) {

        Alert.alert('Error', 'No se pudo enviar la imagen');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const viewImage = useCallback(async (imageId: string) => {
    try {
      const result = await mediaService.markAsViewed(imageId);
      
      if (result.success) {
        markImageAsViewed(imageId);
        
        if (result.expired) {
          Alert.alert(
            '🔥 Imagen vista',
            'Esta imagen se ha autodestruido después de verla'
          );
        }
      }
      
      return result;
    } catch (error) {

      throw error;
    }
  }, []);

  const deleteImage = useCallback(async (imageId: string, storagePath: string) => {
    try {
      await mediaService.deleteImage(imageId, storagePath);
      removeImage(imageId);
      Alert.alert('✅ Eliminado', 'Imagen eliminada correctamente');
    } catch (error) {

      Alert.alert('Error', 'No se pudo eliminar la imagen');
      throw error;
    }
  }, []);

  const pickAndSendImage = useCallback(
    async (toUserId: string, options?: SendPrivateImageOptions) => {
      try {
        const permissions = await mediaService.requestPermissions();
        if (!permissions.media) {
          Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería');
          return;
        }

        const image = await mediaService.pickImage();
        if (!image) return;

        await sendImage(toUserId, image.uri, options);
      } catch (error) {

      }
    },
    [sendImage]
  );

  const takeAndSendPhoto = useCallback(
    async (toUserId: string, options?: SendPrivateImageOptions) => {
      try {
        const permissions = await mediaService.requestPermissions();
        if (!permissions.camera) {
          Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu cámara');
          return;
        }

        const photo = await mediaService.takePhoto();
        if (!photo) return;

        await sendImage(toUserId, photo.uri, options);
      } catch (error) {

      }
    },
    [sendImage]
  );

  return {
    pendingImages,
    viewedImages,
    isLoading,
    loadPendingImages,
    sendImage,
    viewImage,
    deleteImage,
    pickAndSendImage,
    takeAndSendPhoto,
  };
}
