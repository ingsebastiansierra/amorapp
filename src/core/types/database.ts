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
          created_at: string;
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
    };
  };
}
