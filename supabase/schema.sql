-- Schema actualizado de la base de datos
-- Fecha: 2026-02-20
-- Este archivo refleja el estado actual de la base de datos en producción

-- Tabla de desafíos
CREATE TABLE public.challenges (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    is_premium boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT challenges_pkey PRIMARY KEY (id)
);

-- Tabla de usuarios
CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
    name text NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    avatar_url text,
    couple_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text])),
    birth_date date,
    last_name_change timestamp with time zone DEFAULT now(),
    last_seen timestamp with time zone DEFAULT now(),
    push_token text,
    push_token_updated_at timestamp with time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Tabla de parejas
CREATE TABLE public.couples (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user1_id uuid NOT NULL,
    user2_id uuid NOT NULL,
    connection_score integer DEFAULT 50,
    streak_days integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    relationship_start_date date DEFAULT CURRENT_DATE,
    CONSTRAINT couples_pkey PRIMARY KEY (id),
    CONSTRAINT couples_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(id),
    CONSTRAINT couples_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(id)
);

-- Tabla de progreso de desafíos
CREATE TABLE public.challenge_progress (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    couple_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT challenge_progress_pkey PRIMARY KEY (id),
    CONSTRAINT challenge_progress_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id),
    CONSTRAINT challenge_progress_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);

-- Tabla de métricas de conexión
CREATE TABLE public.connection_metrics (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    couple_id uuid NOT NULL,
    date date NOT NULL,
    interactions_count integer DEFAULT 0,
    emotional_sync_score real DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT connection_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT connection_metrics_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
);

-- Tabla de eventos de pareja
CREATE TABLE public.couple_events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    couple_id uuid NOT NULL,
    created_by uuid NOT NULL,
    title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
    description text CHECK (description IS NULL OR length(description) <= 500),
    event_date timestamp with time zone NOT NULL,
    event_type text NOT NULL CHECK (event_type = ANY (ARRAY['anniversary'::text, 'date'::text, 'movie'::text, 'special'::text, 'other'::text])),
    location text CHECK (location IS NULL OR length(location) <= 200),
    reminder_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT couple_events_pkey PRIMARY KEY (id),
    CONSTRAINT couple_events_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id),
    CONSTRAINT couple_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Tabla de estados emocionales
CREATE TABLE public.emotional_states (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    state text NOT NULL,
    intensity real DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT emotional_states_pkey PRIMARY KEY (id),
    CONSTRAINT emotional_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Tabla de sincronizaciones emocionales
CREATE TABLE public.emotional_syncs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    couple_id uuid,
    emotion text NOT NULL,
    synced_at timestamp without time zone DEFAULT now(),
    ended_at timestamp without time zone,
    duration_seconds integer,
    resulted_in_message boolean DEFAULT false,
    CONSTRAINT emotional_syncs_pkey PRIMARY KEY (id),
    CONSTRAINT emotional_syncs_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
);

-- Tabla de gestos
CREATE TABLE public.gestures (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    type text NOT NULL,
    intensity real DEFAULT 1.0,
    duration integer DEFAULT 0,
    seen boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gestures_pkey PRIMARY KEY (id),
    CONSTRAINT gestures_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id),
    CONSTRAINT gestures_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id)
);

-- Tabla de interacciones de corazón
CREATE TABLE public.heart_interactions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    pressure_duration integer NOT NULL,
    reciprocated boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT heart_interactions_pkey PRIMARY KEY (id),
    CONSTRAINT heart_interactions_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id),
    CONSTRAINT heart_interactions_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id)
);

-- Tabla de imágenes privadas
CREATE TABLE public.images_private (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    storage_path text NOT NULL,
    view_mode text DEFAULT 'normal'::text,
    viewed boolean DEFAULT false,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    media_type text DEFAULT 'photo'::text CHECK (media_type = ANY (ARRAY['photo'::text, 'video'::text])),
    thumbnail_path text,
    caption text CHECK (char_length(caption) <= 200),
    view_count integer DEFAULT 0,
    max_views integer DEFAULT 1,
    viewed_at timestamp with time zone,
    is_expired boolean DEFAULT false,
    file_size bigint,
    duration integer,
    CONSTRAINT images_private_pkey PRIMARY KEY (id),
    CONSTRAINT images_private_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id),
    CONSTRAINT images_private_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id)
);

-- Tabla de galería personal
CREATE TABLE public.personal_gallery (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    image_path text NOT NULL,
    thumbnail_path text,
    visibility text NOT NULL DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY['private'::text, 'visible'::text])),
    caption text CHECK (char_length(caption) <= 500),
    file_size bigint,
    width integer,
    height integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_gallery_pkey PRIMARY KEY (id),
    CONSTRAINT personal_gallery_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabla de mensajes sincronizados (ACTUALIZADA: 500 caracteres)
CREATE TABLE public.sync_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    couple_id uuid NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    message text NOT NULL CHECK (char_length(message) <= 500 AND char_length(message) >= 1),
    synced_emotion text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    reply_to_message_id uuid,
    CONSTRAINT sync_messages_pkey PRIMARY KEY (id),
    CONSTRAINT sync_messages_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id),
    CONSTRAINT sync_messages_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id),
    CONSTRAINT sync_messages_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id),
    CONSTRAINT sync_messages_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES public.sync_messages(id)
);

-- Tabla de rachas de sincronización
CREATE TABLE public.sync_streaks (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    couple_id uuid UNIQUE,
    current_streak integer DEFAULT 0,
    best_streak integer DEFAULT 0,
    last_sync_date date,
    total_syncs integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT sync_streaks_pkey PRIMARY KEY (id),
    CONSTRAINT sync_streaks_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
);

-- Tabla de notas de voz
CREATE TABLE public.voice_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    storage_path text NOT NULL,
    duration integer NOT NULL CHECK (duration > 0 AND duration <= 30),
    waveform_data jsonb,
    listened boolean DEFAULT false,
    listened_at timestamp with time zone,
    is_expired boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval),
    CONSTRAINT voice_notes_pkey PRIMARY KEY (id),
    CONSTRAINT voice_notes_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id),
    CONSTRAINT voice_notes_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_sync_messages_couple ON public.sync_messages(couple_id);
CREATE INDEX IF NOT EXISTS idx_sync_messages_to_user ON public.sync_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_sync_messages_created ON public.sync_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_messages_couple_created ON public.sync_messages(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_messages_unread ON public.sync_messages(to_user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_sync_messages_reply ON public.sync_messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

-- Comentarios
COMMENT ON TABLE public.sync_messages IS 'Mensajes sincronizados entre parejas (máximo 500 caracteres)';
COMMENT ON COLUMN public.sync_messages.message IS 'Contenido del mensaje (1-500 caracteres)';
COMMENT ON COLUMN public.sync_messages.reply_to_message_id IS 'ID del mensaje al que se está respondiendo';
