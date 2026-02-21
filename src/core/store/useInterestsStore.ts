import { create } from 'zustand';
import { interestsService } from '../services/interestsService';
import type {
  UserIntention,
  UserInterests,
  UserPreferences,
  IntentionType,
  ActivityType,
  AvailabilityType,
} from '../types/interests';

interface InterestsState {
  // Estado
  intention: UserIntention | null;
  interests: UserInterests | null;
  preferences: UserPreferences | null;
  loading: boolean;
  profileCompletionPercentage: number;

  // Acciones - Intentions
  loadIntention: (userId: string) => Promise<void>;
  setIntention: (
    userId: string,
    intentionType: IntentionType,
    activity?: ActivityType,
    availability?: AvailabilityType
  ) => Promise<void>;
  deactivateIntention: (userId: string) => Promise<void>;

  // Acciones - Interests
  loadInterests: (userId: string) => Promise<void>;
  updateInterests: (
    userId: string,
    interests: Partial<Omit<UserInterests, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => Promise<void>;
  markProfileAsCompleted: (userId: string) => Promise<void>;

  // Acciones - Preferences
  loadPreferences: (userId: string) => Promise<void>;
  updatePreferences: (
    userId: string,
    preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => Promise<void>;

  // Helpers
  loadAll: (userId: string) => Promise<void>;
  calculateProfileCompletion: (userId: string) => Promise<void>;
  initializeProfile: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useInterestsStore = create<InterestsState>((set, get) => ({
  // Estado inicial
  intention: null,
  interests: null,
  preferences: null,
  loading: false,
  profileCompletionPercentage: 0,

  // ============================================
  // INTENTIONS
  // ============================================

  loadIntention: async (userId: string) => {
    try {
      set({ loading: true });
      const intention = await interestsService.getUserIntention(userId);
      set({ intention, loading: false });
    } catch (error) {
      console.error('Error loading intention:', error);
      set({ loading: false });
    }
  },

  setIntention: async (
    userId: string,
    intentionType: IntentionType,
    activity?: ActivityType,
    availability: AvailabilityType = 'flexible'
  ) => {
    try {
      set({ loading: true });
      const intention = await interestsService.setUserIntention(
        userId,
        intentionType,
        activity,
        availability
      );
      set({ intention, loading: false });
    } catch (error) {
      console.error('Error setting intention:', error);
      set({ loading: false });
      throw error;
    }
  },

  deactivateIntention: async (userId: string) => {
    try {
      await interestsService.deactivateIntention(userId);
      set({ intention: null });
    } catch (error) {
      console.error('Error deactivating intention:', error);
      throw error;
    }
  },

  // ============================================
  // INTERESTS
  // ============================================

  loadInterests: async (userId: string) => {
    try {
      set({ loading: true });
      const interests = await interestsService.getUserInterests(userId);
      set({ interests, loading: false });
      
      // Calcular completitud del perfil
      if (interests) {
        await get().calculateProfileCompletion(userId);
      }
    } catch (error) {
      console.error('Error loading interests:', error);
      set({ loading: false });
    }
  },

  updateInterests: async (
    userId: string,
    interestsUpdate: Partial<Omit<UserInterests, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      set({ loading: true });
      const interests = await interestsService.updateUserInterests(userId, interestsUpdate);
      set({ interests, loading: false });
      
      // Recalcular completitud
      await get().calculateProfileCompletion(userId);
    } catch (error) {
      console.error('Error updating interests:', error);
      set({ loading: false });
      throw error;
    }
  },

  markProfileAsCompleted: async (userId: string) => {
    try {
      await interestsService.markProfileAsCompleted(userId);
      const interests = get().interests;
      if (interests) {
        set({ interests: { ...interests, profile_completed: true } });
      }
    } catch (error) {
      console.error('Error marking profile as completed:', error);
      throw error;
    }
  },

  // ============================================
  // PREFERENCES
  // ============================================

  loadPreferences: async (userId: string) => {
    try {
      set({ loading: true });
      const preferences = await interestsService.getUserPreferences(userId);
      set({ preferences, loading: false });
    } catch (error) {
      console.error('Error loading preferences:', error);
      set({ loading: false });
    }
  },

  updatePreferences: async (
    userId: string,
    preferencesUpdate: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      set({ loading: true });
      const preferences = await interestsService.updateUserPreferences(userId, preferencesUpdate);
      set({ preferences, loading: false });
    } catch (error) {
      console.error('Error updating preferences:', error);
      set({ loading: false });
      throw error;
    }
  },

  // ============================================
  // HELPERS
  // ============================================

  loadAll: async (userId: string) => {
    try {
      set({ loading: true });
      await Promise.all([
        get().loadIntention(userId),
        get().loadInterests(userId),
        get().loadPreferences(userId),
      ]);
      set({ loading: false });
    } catch (error) {
      console.error('Error loading all interests data:', error);
      set({ loading: false });
    }
  },

  calculateProfileCompletion: async (userId: string) => {
    try {
      const percentage = await interestsService.getProfileCompletionPercentage(userId);
      set({ profileCompletionPercentage: percentage });
    } catch (error) {
      console.error('Error calculating profile completion:', error);
    }
  },

  initializeProfile: async (userId: string) => {
    try {
      set({ loading: true });
      await interestsService.initializeUserProfile(userId);
      await get().loadAll(userId);
      set({ loading: false });
    } catch (error) {
      console.error('Error initializing profile:', error);
      set({ loading: false });
      throw error;
    }
  },

  reset: () => {
    set({
      intention: null,
      interests: null,
      preferences: null,
      loading: false,
      profileCompletionPercentage: 0,
    });
  },
}));
