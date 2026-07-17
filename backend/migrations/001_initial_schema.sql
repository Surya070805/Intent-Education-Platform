-- Users (managed by Supabase Auth, extended here)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Career Tracks
CREATE TABLE IF NOT EXISTS public.careers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE,          -- e.g. "Full-Stack Development"
  slug        TEXT UNIQUE,          -- e.g. "full-stack-dev"
  description TEXT,
  icon_url    TEXT
);

-- Skills
CREATE TABLE IF NOT EXISTS public.skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id   UUID REFERENCES public.careers(id),
  name        TEXT,
  slug        TEXT UNIQUE,
  description TEXT,
  level       TEXT,                  -- foundation / intermediate / advanced
  estimated_hours INT
);

-- Learning Intent Profile
CREATE TABLE IF NOT EXISTS public.learning_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  career_id       UUID REFERENCES public.careers(id),
  experience      TEXT,              -- beginner / intermediate / advanced
  known_skills    JSONB,             -- array of skill IDs
  learning_style  TEXT,              -- video / reading / project-based
  daily_minutes   INT,
  language        TEXT DEFAULT 'en',
  onboarded_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Skill Prerequisite Graph (adjacency list)
CREATE TABLE IF NOT EXISTS public.skill_prerequisites (
  skill_id       UUID REFERENCES public.skills(id),
  prerequisite_id UUID REFERENCES public.skills(id),
  PRIMARY KEY (skill_id, prerequisite_id)
);

-- Learner Skill Mastery
CREATE TABLE IF NOT EXISTS public.user_skill_mastery (
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id      UUID REFERENCES public.skills(id),
  mastery_level FLOAT DEFAULT 0.0,  -- 0.0 to 1.0
  last_updated  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

-- Resources (YouTube videos + curated content)
CREATE TABLE IF NOT EXISTS public.resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id      TEXT UNIQUE,
  title           TEXT,
  channel_name    TEXT,
  channel_id      TEXT,
  duration_seconds INT,
  difficulty      TEXT,              -- beginner / intermediate / advanced
  thumbnail_url   TEXT,
  description     TEXT,
  view_count      BIGINT,
  like_count      BIGINT,
  published_at    TIMESTAMPTZ,
  skills          JSONB,             -- array of skill IDs
  metadata        JSONB,             -- extensible
  is_curated      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  resource_id     UUID REFERENCES public.resources(id),
  skill_id        UUID REFERENCES public.skills(id),
  score           FLOAT,
  explanation     TEXT,              -- LLM-generated explanation
  status          TEXT DEFAULT 'pending', -- pending / saved / dismissed / completed
  generated_at    TIMESTAMPTZ DEFAULT now(),
  acted_at        TIMESTAMPTZ
);

-- Learning Sessions
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  resource_id     UUID REFERENCES public.resources(id),
  recommendation_id UUID REFERENCES public.recommendations(id),
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  duration_seconds INT,
  status          TEXT DEFAULT 'active' -- active / completed / abandoned
);

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.recommendations(id),
  session_id      UUID REFERENCES public.learning_sessions(id),
  rating          INT,               -- 1-5
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);
