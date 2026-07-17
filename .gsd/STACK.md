# STACK.md — Bloom Technology Stack

> Authoritative reference for all technology choices.
> Last updated: 2026-07-17

---

## Frontend

| Tool | Version | Purpose |
|---|---|---|
| React | 18+ | UI component library |
| Vite | 5+ | Build tool and dev server |
| TypeScript | 5+ | Type safety |
| React Router | 6+ | Client-side routing (web app) |
| Supabase JS Client | 2+ | Auth + DB queries from frontend |

---

## Browser Extension

| Tool | Purpose |
|---|---|
| Chrome Extension Manifest V3 | Extension specification |
| Vite + CRXJS (or custom build) | Extension build tooling |
| React (popup + content script) | UI in extension surfaces |
| chrome.storage.local | Persisting auth tokens in extension |

---

## Backend

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.110+ | Web framework |
| Pydantic | 2+ | Data validation and serialization |
| Uvicorn | 0.29+ | ASGI server |
| httpx | 0.27+ | Async HTTP client (YouTube API) |
| openai | 1.x | OpenAI SDK (via LLMProvider wrapper) |
| supabase-py | 2+ | Supabase client for server-side operations |
| python-jose | 3.x | JWT validation |
| slowapi | 0.1+ | Rate limiting |

---

## Database + Auth + Infrastructure

| Service | Purpose |
|---|---|
| Supabase (PostgreSQL) | Primary relational database |
| Supabase Auth | Authentication (email/password + Google OAuth) |
| Supabase Storage | File storage (avatars, exports) |
| Supabase RLS | Row-level security for per-user data isolation |

---

## AI + External APIs

| Service | Purpose |
|---|---|
| OpenAI GPT-4o-mini | LLM for onboarding conversation, explanation generation, roadmap generation |
| YouTube Data API v3 | Resource metadata retrieval and video search |

**Abstraction**: All LLM calls go through `LLMProvider` base class. Swap provider by implementing a new subclass.

---

## Hosting + Deployment

| Service | What it hosts |
|---|---|
| Vercel | Web companion app (static SPA) |
| Railway or Render | FastAPI backend (Docker container) |
| Supabase | Database, Auth, Storage |
| GitHub Actions | CI/CD pipeline |

---

## Dev Tooling

| Tool | Purpose |
|---|---|
| ESLint + Prettier | Frontend linting and formatting |
| Ruff + Black | Python linting and formatting |
| TypeScript strict mode | Type safety |
| Vitest | Frontend unit tests |
| pytest | Backend unit + integration tests |
| dotenv | Environment variable management |

---

## Package Management

| Runtime | Package Manager |
|---|---|
| Node.js (FE) | npm |
| Python (BE) | pip with `requirements.txt` (or `uv` for speed) |

---

## Environment Variables

### Backend (`/backend/.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
OPENAI_API_KEY=
YOUTUBE_API_KEY=
ENVIRONMENT=development
```

### Frontend Web App (`/web/.env`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=
```

### Extension (`/extension/.env`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=
```
