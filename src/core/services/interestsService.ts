import { supabase } from '../config/supabase';
import type { 
  UserIntention, 
  UserInterests, 
  UserPreferences,
  IntentionType,
  ActivityType,
  AvailabilityType
} from '../types/interests';

class InterestsService {
  // ============================================
  // USER INTENTIONS
  // ============================================

  async getUserIntention(userId: string): Promise<UserIntention | null> {
    try {
      const { data, error } = await supabase
        .from('user_intentions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user intention:', error);
      return null;
    }
  }

  async setUserIntention(
    userId: string,
    intentionType: IntentionType,
    activity?: ActivityType,
    availability: AvailabilityType = 'flexible'
  ): Promise<UserIntention | null> {
    try {
      // Obtener el usuario autenticado actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('user_intentions')
        .upsert({
          user_id: user.id, // Usar el ID autenticado
          intention_type: intentionType,
          activity,
          availability,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting user intention:', error);
      throw error;
    }
  }

  async deactivateIntention(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_intentions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deactivating intention:', error);
      return false;
    }
  }

  // ============================================
  // USER INTERESTS
  // ============================================

  async getUserInterests(userId: string): Promise<UserInterests | null> {
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user interests:', error);
      return null;
    }
  }

  async updateUserInterests(
    userId: string,
    interests: Partial<Omit<UserInterests, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserInterests | null> {
    try {
      console.log('📝 Updating interests for user:', userId);
      
      // Obtener el usuario autenticado actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('🔐 Authenticated user ID:', user.id);

      const { data, error } = await supabase
        .from('user_interests')
        .upsert({
          user_id: user.id, // Usar el ID autenticado
          ...interests,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating interests:', error);
        throw error;
      }

      console.log('✅ Interests updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating user interests:', error);
      throw error;
    }
  }

  async markProfileAsCompleted(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_interests')
        .update({ 
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking profile as completed:', error);
      return false;
    }
  }

  // ============================================
  // USER PREFERENCES
  // ============================================

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserPreferences | null> {
    try {
      console.log('📝 Updating preferences for user:', userId);
      console.log('📝 Preferences data:', preferences);

      // Obtener el usuario autenticado actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('🔐 Authenticated user ID:', user.id);
      console.log('📋 Provided user ID:', userId);

      // Usar el ID del usuario autenticado (más seguro)
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id, // Usar el ID autenticado en lugar del parámetro
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user preferences:', error);
        throw error;
      }

      console.log('✅ Preferences updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // ============================================
  // PROFILE COMPLETION
  // ============================================

  async getProfileCompletionPercentage(userId: string): Promise<number> {
    try {
      const interests = await this.getUserInterests(userId);
      if (!interests) return 0;

      let completed = 0;
      let total = 0;

      // Música (3 campos)
      total += 3;
      if (interests.music_favorite_artist) completed++;
      if (interests.music_favorite_song) completed++;
      if (interests.music_genres.length > 0) completed++;

      // Entretenimiento (4 campos)
      total += 4;
      if (interests.entertainment_favorite_movie) completed++;
      if (interests.entertainment_favorite_series) completed++;
      if (interests.entertainment_favorite_book) completed++;
      if (interests.entertainment_hobbies.length > 0) completed++;

      // Deportes (3 campos)
      total += 3;
      if (interests.sports_favorite_sport) completed++;
      if (interests.sports_activity_level) completed++;
      if (interests.sports_workout_preferences.length > 0) completed++;

      // Comida (3 campos)
      total += 3;
      if (interests.food_favorite_food) completed++;
      if (interests.food_dietary.length > 0) completed++;
      if (interests.food_cooking_skill) completed++;

      // Estilo de vida (3 campos)
      total += 3;
      if (interests.lifestyle_favorite_color) completed++;
      if (interests.lifestyle_rhythm) completed++;
      if (interests.lifestyle_zodiac_sign) completed++;

      // Viajes (2 campos)
      total += 2;
      if (interests.travel_favorite_place) completed++;
      if (interests.travel_dream_destination) completed++;

      // Valores (3 campos)
      total += 3;
      if (interests.values_relationship_goal) completed++;
      if (interests.values_wants_kids) completed++;
      if (interests.values_pets.length > 0) completed++;

      return Math.round((completed / total) * 100);
    } catch (error) {
      console.error('Error calculating profile completion:', error);
      return 0;
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  async initializeUserProfile(userId: string): Promise<boolean> {
    try {
      // Crear intereses vacíos
      await supabase.from('user_interests').upsert({
        user_id: userId,
        music_genres: [],
        entertainment_hobbies: [],
        sports_workout_preferences: [],
        food_dietary: [],
        values_pets: [],
        values_has_kids: false,
        values_smokes: false,
        profile_completed: false,
      }, { onConflict: 'user_id' });

      // Crear preferencias por defecto
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        looking_for_gender: 'any',
        age_range_min: 18,
        age_range_max: 35,
        distance_max_km: 50,
        deal_breakers: [],
        must_haves: [],
        show_location: true,
        show_last_seen: true,
        show_emotion_history: false,
        show_age: true,
        notifications_new_matches: true,
        notifications_messages: true,
        notifications_syncs: true,
      }, { onConflict: 'user_id' });

      return true;
    } catch (error) {
      console.error('Error initializing user profile:', error);
      return false;
    }
  }
}

export const interestsService = new InterestsService();
