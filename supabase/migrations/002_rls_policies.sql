-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_metrics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Couples policies
CREATE POLICY "Users can view their couple"
  ON public.couples FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Emotional states policies
CREATE POLICY "Users can insert their own emotional state"
  ON public.emotional_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view partner's emotional state"
  ON public.emotional_states FOR SELECT
  USING (
    user_id IN (
      SELECT user1_id FROM public.couples WHERE user2_id = auth.uid()
      UNION
      SELECT user2_id FROM public.couples WHERE user1_id = auth.uid()
    )
  );

-- Gestures policies
CREATE POLICY "Users can send gestures"
  ON public.gestures FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view gestures sent to them"
  ON public.gestures FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can update gestures sent to them"
  ON public.gestures FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Heart interactions policies
CREATE POLICY "Users can send heart interactions"
  ON public.heart_interactions FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view their heart interactions"
  ON public.heart_interactions FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Challenges policies (public read)
CREATE POLICY "Anyone can view challenges"
  ON public.challenges FOR SELECT
  USING (true);

-- Challenge progress policies
CREATE POLICY "Couples can view their progress"
  ON public.challenge_progress FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Couples can insert their progress"
  ON public.challenge_progress FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Images private policies
CREATE POLICY "Users can upload images to partner"
  ON public.images_private FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view images sent to them"
  ON public.images_private FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can update images sent to them"
  ON public.images_private FOR UPDATE
  USING (auth.uid() = to_user_id);
