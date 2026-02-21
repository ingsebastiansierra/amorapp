export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          couple_id: string | null;
          gender: string | null;
          birth_date: string | null;
          last_name_change: string | null;
          created_at: string;
          // Nuevos campos para sistema de conexiones múltiples
          bio: string | null;
          photos: string[];
          is_available: boolean;
          connection_limit: number;
          current_connections: number;
          is_premium: boolean;
          premium_until: string | null;
          trust_score: number;
          is_verified: boolean;
          is_banned: boolean;
          banned_until: string | null;
          last_active: string;
          location_lat: number | null;
          location_lng: number | null;
          city: string | null;
          country: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      couples: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          connection_score: number;
          streak_days: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['couples']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['couples']['Insert']>;
      };
      emotional_states: {
        Row: {
          id: string;
          user_id: string;
          state: string;
          intensity: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['emotional_states']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['emotional_states']['Insert']>;
      };
      gestures: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          type: string;
          intensity: number;
          duration: number;
          seen: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gestures']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['gestures']['Insert']>;
      };
      heart_interactions: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          pressure_duration: number;
          reciprocated: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['heart_interactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['heart_interactions']['Insert']>;
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          is_premium: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['challenges']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['challenges']['Insert']>;
      };
      challenge_progress: {
        Row: {
          id: string;
          couple_id: string;
          challenge_id: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['challenge_progress']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['challenge_progress']['Insert']>;
      };
      images_private: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          storage_path: string;
          media_type: 'photo' | 'video';
          thumbnail_path: string | null;
          caption: string | null;
          view_count: number;
          max_views: number | null;
          viewed: boolean;
          viewed_at: string | null;
          is_expired: boolean;
          file_size: number | null;
          duration: number | null;
          expires_at: string | null;
          view_mode: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['images_private']['Row'], 'id' | 'created_at' | 'view_count' | 'viewed' | 'is_expired'>;
        Update: Partial<Database['public']['Tables']['images_private']['Insert']>;
      };
      sync_messages: {
        Row: {
          id: string;
          couple_id: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          synced_emotion: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sync_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sync_messages']['Insert']>;
      };
      // ============================================
      // NUEVAS TABLAS: Sistema de Intereses y Conexiones
      // ============================================
      user_intentions: {
        Row: {
          id: string;
          user_id: string;
          intention_type: string;
          activity: string | null;
          availability: string;
          is_active: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_intentions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_intentions']['Insert']>;
      };
      user_interests: {
        Row: {
          id: string;
          user_id: string;
          music_favorite_artist: string | null;
          music_favorite_song: string | null;
          music_genres: string[];
          entertainment_favorite_movie: string | null;
          entertainment_favorite_series: string | null;
          entertainment_favorite_book: string | null;
          entertainment_hobbies: string[];
          sports_favorite_sport: string | null;
          sports_favorite_team: string | null;
          sports_activity_level: string | null;
          sports_workout_preferences: string[];
          food_favorite_food: string | null;
          food_favorite_restaurant: string | null;
          food_dietary: string[];
          food_cooking_skill: string | null;
          lifestyle_favorite_color: string | null;
          lifestyle_personality_type: string | null;
          lifestyle_zodiac_sign: string | null;
          lifestyle_love_language: string | null;
          lifestyle_rhythm: string | null;
          travel_favorite_place: string | null;
          travel_dream_destination: string | null;
          travel_frequency: string | null;
          values_relationship_goal: string | null;
          values_has_kids: boolean;
          values_wants_kids: string | null;
          values_drinks: string | null;
          values_smokes: boolean;
          values_pets: string[];
          profile_completed: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_interests']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_interests']['Insert']>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          looking_for_gender: string;
          age_range_min: number;
          age_range_max: number;
          distance_max_km: number;
          deal_breakers: string[];
          must_haves: string[];
          show_location: boolean;
          show_last_seen: boolean;
          show_emotion_history: boolean;
          show_age: boolean;
          notifications_new_matches: boolean;
          notifications_messages: boolean;
          notifications_syncs: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
      connections: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          initiated_by: string;
          status: string;
          initial_message: string | null;
          initial_intention: string | null;
          can_see_emotions: boolean;
          can_send_messages: boolean;
          can_see_location: boolean;
          can_send_media: boolean;
          messages_count: number;
          syncs_count: number;
          last_message_at: string | null;
          daily_message_limit: number;
          created_at: string;
          accepted_at: string | null;
          ended_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['connections']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['connections']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          user_id: string;
          matched_user_id: string;
          intention_at_match: string | null;
          compatibility_score: number;
          distance_km: number | null;
          status: string;
          matched_at: string;
          expires_at: string;
          responded_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'matched_at'>;
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          connection_id: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          message_type: string;
          read: boolean;
          read_at: string | null;
          created_at: string;
          reply_to_message_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      swipes: {
        Row: {
          id: string;
          user_id: string;
          swiped_user_id: string;
          action: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['swipes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['swipes']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          reported_user_id: string;
          reported_by: string;
          reason: string;
          description: string;
          evidence: string[] | null;
          status: string;
          admin_notes: string | null;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
      blocks: {
        Row: {
          id: string;
          blocker_user_id: string;
          blocked_user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blocks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['blocks']['Insert']>;
      };
      compatibility_cache: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          compatibility_score: number;
          common_interests: any | null;
          calculated_at: string;
          expires_at: string;
        };
        Insert: Omit<Database['public']['Tables']['compatibility_cache']['Row'], 'id' | 'calculated_at'>;
        Update: Partial<Database['public']['Tables']['compatibility_cache']['Insert']>;
      };
    };
  };
}
