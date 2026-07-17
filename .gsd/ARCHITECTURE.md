# ARCHITECTURE.md — Bloom System Architecture

> Living document. Updated as architecture evolves.
> Last updated: 2026-07-17

---

## System Overview

Bloom is composed of three deployable units for MVP:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BLOOM SYSTEM                              │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │   Chrome     │    │   Web App    │    │   FastAPI         │  │
│  │  Extension   │───▶│  (Vite+React)│───▶│   Backend         │  │
│  │  (MV3)       │    │  Companion   │    │                   │  │
│  └──────────────┘    └──────────────┘    └────────┬──────────┘  │
│                                                   │             │
│                                    ┌──────────────┼──────────┐  │
│                                    │              │          │  │
│                               ┌────▼────┐  ┌─────▼────┐     │  │
│                               │Supabase │  │ YouTube  │     │  │
│                               │(DB+Auth)│  │ API v3   │     │  │
│                               └─────────┘  └──────────┘     │  │
│                                    │                         │  │
│                               ┌────▼────┐                    │  │
│                               │   LLM   │                    │  │
│                               │Provider │                    │  │
│                               │(OpenAI) │                    │  │
│                               └─────────┘                    │  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
bloom/
├── .gsd/                          # GSD project docs
├── extension/                     # Chrome MV3 extension
│   ├── src/
│   │   ├── background/            # Service worker
│   │   ├── content/               # YouTube content scripts
│   │   ├── popup/                 # Extension popup UI
│   │   └── components/            # Shared React components
│   ├── public/
│   │   └── manifest.json
│   └── vite.config.ts
│
├── web/                           # Companion web app
│   ├── src/
│   │   ├── pages/                 # Route-level components
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Roadmap.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── Search.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # API client, Supabase client
│   │   └── types/                 # Shared TypeScript types
│   └── vite.config.ts
│
├── backend/                       # FastAPI application
│   ├── app/
│   │   ├── api/                   # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── onboarding.py
│   │   │   ├── recommendations.py
│   │   │   ├── sessions.py
│   │   │   ├── feedback.py
│   │   │   ├── search.py
│   │   │   └── analytics.py
│   │   ├── core/                  # Config, settings, middleware
│   │   ├── models/                # Pydantic models
│   │   ├── services/              # Business logic
│   │   │   ├── llm_provider.py    # LLM abstraction
│   │   │   ├── recommender.py     # Scoring engine
│   │   │   ├── skill_graph.py     # Graph traversal
│   │   │   └── youtube.py         # YouTube API client
│   │   └── db/                    # DB client, queries
│   ├── migrations/                # SQL migration files
│   ├── requirements.txt
│   └── main.py
│
├── shared/                        # Shared types / contracts (optional)
├── .github/
│   └── workflows/                 # CI/CD pipelines
├── .env.example
└── README.md
```

---

## Logical Layers

### 1. Presentation Layer
- **Chrome Extension (MV3)**: YouTube content script overlay, extension popup.
- **Web Companion App**: Dashboard, roadmap, progress, onboarding, settings.

### 2. Application Layer (FastAPI)
- API routing and authentication middleware
- Request validation (Pydantic)
- Service orchestration
- Rate limiting

### 3. Learning Intelligence Layer
- `LLMProvider`: Abstract AI interface (GPT-4o-mini first)
- `RecommenderService`: Rules-based scoring + LLM explanation generation
- `SkillGraphService`: Prerequisite traversal, skill gap identification
- `OnboardingService`: Intent profile generation, roadmap initialization

### 4. Data Layer (Supabase / PostgreSQL)
- Core relational tables (see DATABASE SCHEMA section)
- Supabase RLS for per-user data isolation
- JSONB columns for flexible metadata

### 5. External Platform Layer
- YouTube Data API v3
- OpenAI API (via LLMProvider)

---

## Database Schema (MVP)

### Core Tables

```sql
-- Users (managed by Supabase Auth, extended here)
users (
  id            UUID PRIMARY KEY,  -- Supabase auth.users.id
  email         TEXT UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
)

-- Learning Intent Profile
learning_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  career_id       UUID REFERENCES careers(id),
  experience      TEXT,              -- beginner / intermediate / advanced
  known_skills    JSONB,             -- array of skill IDs
  learning_style  TEXT,              -- video / reading / project-based
  daily_minutes   INT,
  language        TEXT DEFAULT 'en',
  onboarded_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
)

-- Career Tracks
careers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE,          -- e.g. "Full-Stack Development"
  slug        TEXT UNIQUE,          -- e.g. "full-stack-dev"
  description TEXT,
  icon_url    TEXT
)

-- Skills
skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id   UUID REFERENCES careers(id),
  name        TEXT,
  slug        TEXT UNIQUE,
  description TEXT,
  level       TEXT,                  -- foundation / intermediate / advanced
  estimated_hours INT
)

-- Skill Prerequisite Graph (adjacency list)
skill_prerequisites (
  skill_id       UUID REFERENCES skills(id),
  prerequisite_id UUID REFERENCES skills(id),
  PRIMARY KEY (skill_id, prerequisite_id)
)

-- Learner Skill Mastery
user_skill_mastery (
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_id      UUID REFERENCES skills(id),
  mastery_level FLOAT DEFAULT 0.0,  -- 0.0 to 1.0
  last_updated  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
)

-- Resources (YouTube videos + curated content)
resources (
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
)

-- Recommendations
recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_id     UUID REFERENCES resources(id),
  skill_id        UUID REFERENCES skills(id),
  score           FLOAT,
  explanation     TEXT,              -- LLM-generated explanation
  status          TEXT DEFAULT 'pending', -- pending / saved / dismissed / completed
  generated_at    TIMESTAMPTZ DEFAULT now(),
  acted_at        TIMESTAMPTZ
)

-- Learning Sessions
learning_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_id     UUID REFERENCES resources(id),
  recommendation_id UUID REFERENCES recommendations(id),
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  duration_seconds INT,
  status          TEXT DEFAULT 'active' -- active / completed / abandoned
)

-- Feedback
feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES recommendations(id),
  session_id      UUID REFERENCES learning_sessions(id),
  rating          INT,               -- 1-5
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
)

-- Analytics Events
analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
)
```

---

## API Routes (MVP)

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`

### Users
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`

### Onboarding
- `POST /api/v1/onboarding/start`
- `PATCH /api/v1/onboarding/update`
- `POST /api/v1/onboarding/complete`

### Careers + Skills
- `GET /api/v1/careers`
- `GET /api/v1/careers/{career_id}/roadmap`
- `GET /api/v1/skills/{skill_id}`

### Recommendations
- `GET /api/v1/recommendations` — get current user's recommendations
- `POST /api/v1/recommendations/generate` — trigger re-generation
- `PATCH /api/v1/recommendations/{id}` — update status (save/dismiss/complete)

### Sessions
- `POST /api/v1/sessions`
- `PATCH /api/v1/sessions/{id}/complete`

### Feedback
- `POST /api/v1/feedback`

### Search
- `GET /api/v1/search?q={query}`

### Health
- `GET /api/v1/health`

---

## Extension Architecture (Chrome MV3)

```
extension/
├── manifest.json                  # MV3 manifest
├── background/
│   └── service-worker.ts          # Handles auth state, API calls, alarms
├── content/
│   └── youtube-overlay.tsx        # Injected into YouTube watch pages
├── popup/
│   └── App.tsx                    # Extension popup (quick stats + links)
└── components/
    └── RecommendationCard.tsx     # Shared card component
```

**Auth flow in extension**:
1. User logs in via web app (Supabase Auth sets tokens in localStorage).
2. Extension reads auth token from storage via `chrome.storage.local`.
3. Extension passes JWT as `Authorization: Bearer <token>` on all API calls.
4. Background service worker handles token refresh.

---

## Security

- All communication over HTTPS.
- Supabase Auth issues JWTs; FastAPI validates them on every protected route.
- RLS enforces: users can only read/write their own rows.
- Passwords never stored (Supabase Auth handles hashing).
- Tokens expire (Supabase default: 1 hour access token, 7-day refresh token).
- Rate limiting on all mutation endpoints.
- YouTube API key stored server-side only (never in extension or web app).
- LLM API key stored server-side only.
