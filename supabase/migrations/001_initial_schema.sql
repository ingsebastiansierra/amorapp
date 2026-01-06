-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  couple_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Couples table
CREATE TABLE public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES public.users(id) NOT NULL,
  user2_id UUID REFERENCES public.users(id) NOT NULL,
  connection_score INTEGER DEFAULT 50,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Emotional states table
CREATE TABLE public.emotional_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  state TEXT NOT NULL,
  intensity REAL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gestures table
CREATE TABLE public.gestures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES public.users(id) NOT NULL,
  to_user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL,
  intensity REAL DEFAULT 1.0,
  duration INTEGER DEFAULT 0,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Heart interactions table
CREATE TABLE public.heart_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES public.users(id) NOT NULL,
  to_user_id UUID REFERENCES public.users(id) NOT NULL,
  pressure_duration INTEGER NOT NULL,
  reciprocated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges table
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge progress table
CREATE TABLE public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images private table
CREATE TABLE public.images_private (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES public.users(id) NOT NULL,
  to_user_id UUID REFERENCES public.users(id) NOT NULL,
  storage_path TEXT NOT NULL,
  view_mode TEXT DEFAULT 'normal',
  viewed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection metrics table
CREATE TABLE public.connection_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) NOT NULL,
  date DATE NOT NULL,
  interactions_count INTEGER DEFAULT 0,
  emotional_sync_score REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, date)
);
