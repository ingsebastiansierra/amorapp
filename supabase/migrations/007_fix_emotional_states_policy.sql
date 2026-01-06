-- Permitir que los usuarios vean su propio estado emocional Y el de su pareja
DROP POLICY IF EXISTS "Users can view partner's emotional state" ON public.emotional_states;

CREATE POLICY "Users can view their own and partner's emotional state"
  ON public.emotional_states FOR SELECT
  USING (
    auth.uid() = user_id  -- Ver mi propio estado
    OR
    user_id IN (  -- Ver el estado de mi pareja
      SELECT user1_id FROM public.couples WHERE user2_id = auth.uid()
      UNION
      SELECT user2_id FROM public.couples WHERE user1_id = auth.uid()
    )
  );
