-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skill_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 1. users
-- Users can read and update their own row
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. learning_profiles
-- Users can read and update their own learning profile
CREATE POLICY "Users can read own learning profile" ON public.learning_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own learning profile" ON public.learning_profiles FOR ALL USING (auth.uid() = user_id);

-- 3. careers (Global Read)
CREATE POLICY "Careers are globally readable" ON public.careers FOR SELECT USING (true);

-- 4. skills (Global Read)
CREATE POLICY "Skills are globally readable" ON public.skills FOR SELECT USING (true);

-- 5. skill_prerequisites (Global Read)
CREATE POLICY "Skill prerequisites are globally readable" ON public.skill_prerequisites FOR SELECT USING (true);

-- 6. user_skill_mastery
CREATE POLICY "Users can read own skill mastery" ON public.user_skill_mastery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own skill mastery" ON public.user_skill_mastery FOR ALL USING (auth.uid() = user_id);

-- 7. resources (Global Read)
CREATE POLICY "Resources are globally readable" ON public.resources FOR SELECT USING (true);

-- 8. recommendations
CREATE POLICY "Users can read own recommendations" ON public.recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON public.recommendations FOR ALL USING (auth.uid() = user_id);

-- 9. learning_sessions
CREATE POLICY "Users can read own learning sessions" ON public.learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own learning sessions" ON public.learning_sessions FOR ALL USING (auth.uid() = user_id);

-- 10. feedback
CREATE POLICY "Users can read own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. analytics_events
CREATE POLICY "Users can insert own analytics events" ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: The FastAPI backend will connect using the SERVICE_ROLE key, which bypasses RLS for system operations.
-- These RLS policies primarily protect endpoints if they are queried directly from the frontend (e.g., via Supabase JS Client),
-- ensuring the frontend can never fetch another user's data.
