// Store para manejar imágenes privadas
import { create } from 'zustand';
import { PrivateImage } from '../types/media';

interface MediaState {
  pendingImages: PrivateImage[];
  viewedImages: PrivateImage[];
  isLoading: boolean;
  
  // Actions
  setPendingImages: (images: PrivateImage[]) => void;
  addPendingImage: (image: PrivateImage) => void;
  markImageAsViewed: (imageId: string) => void;
  removeImage: (imageId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  pendingImages: [],
  viewedImages: [],
  isLoading: false,

  setPendingImages: (images) => set({ pendingImages: images }),
  
  addPendingImage: (image) =>
    set((state) => ({
      pendingImages: [image, ...state.pendingImages],
    })),

  markImageAsViewed: (imageId) =>
    set((state) => {
      const image = state.pendingImages.find((img) => img.id === imageId);
      if (!image) return state;

      return {
        pendingImages: state.pendingImages.filter((img) => img.id !== imageId),
        viewedImages: [{ ...image, viewed: true }, ...state.viewedImages],
      };
    }),

  removeImage: (imageId) =>
    set((state) => ({
      pendingImages: state.pendingImages.filter((img) => img.id !== imageId),
      viewedImages: state.viewedImages.filter((img) => img.id !== imageId),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}));
