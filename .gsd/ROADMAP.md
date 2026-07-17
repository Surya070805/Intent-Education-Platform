# ROADMAP.md — Bloom MVP Roadmap

> **Current Phase**: Not Started
> **Milestone**: v1.0 — MVP (Core Recommendation Loop)
> Last updated: 2026-07-17

---

## Must-Haves (from SPEC)

- [ ] Account creation and login via Supabase Auth
- [ ] AI onboarding flow capturing career goal, skills, preferences
- [ ] Learning Intent Profile generation and storage
- [ ] Career roadmap + skill graph for 2 career tracks
- [ ] Personalized YouTube recommendations with AI explanations
- [ ] Save, dismiss, complete, and rate recommendation actions
- [ ] Learning session tracking and progress persistence
- [ ] Browser extension (Chrome MV3) with YouTube overlay
- [ ] Companion web app with dashboard, roadmap, and progress views

---

## Phases

### Phase 1: Project Foundation
**Status**: Not Started
**Objective**: Repository structure, tooling, environments, CI/CD, coding standards, and all configuration scaffolded. No features — just a working, deployable skeleton.
**Deliverables**:
- Monorepo structure: `/extension`, `/web`, `/backend`
- Vite + React apps bootstrapped for extension and web
- FastAPI backend with health check endpoint
- Supabase project created, environment variables configured
- GitHub Actions CI pipeline (lint + type-check on PR)
- `.env.example` files for all services
- README with local dev setup instructions
**Requirements**: REQ-01, REQ-02

---

### Phase 2: Auth + User Service + Core Schema
**Status**: Not Started
**Objective**: End-to-end authentication, user session management, and all primary database tables created with RLS policies enforced.
**Deliverables**:
- Supabase Auth integration (email/password + Google OAuth)
- JWT validation middleware in FastAPI
- Database schema: users, learning_profiles, careers, skills, skill_prerequisites, resources, recommendations, learning_sessions, feedback, analytics_events
- Supabase RLS policies for per-user data isolation
- Auth flows: register, login, logout, password reset
- Protected API routes working end-to-end
**Requirements**: REQ-03, REQ-04, REQ-05

---

### Phase 3: AI Onboarding + Learning Intent Profile
**Status**: Not Started
**Objective**: Multi-step AI onboarding captures learner context, generates a Learning Intent Profile, and maps the learner to a career roadmap and skill graph.
**Deliverables**:
- Multi-step onboarding UI (career selection, skills assessment, learning style, schedule)
- LLMProvider abstraction class (OpenAI GPT-4o-mini as first implementation)
- Onboarding conversation prompt engineering
- Learning Intent Profile generation and storage
- Career track selection (Full-Stack Dev / Data Science & ML / AI)
- Initial skill graph position determined
- Initial roadmap generated and stored
- Onboarding completion state tracked (no re-onboarding on re-login)
**Requirements**: REQ-06, REQ-07, REQ-08

---

### Phase 4: Recommendation Engine MVP
**Status**: Not Started
**Objective**: Rules-based recommendation scoring + LLM-generated explanations + recommendation cards displayed in web app and extension.
**Deliverables**:
- Resource metadata table populated with curated seed content (YouTube videos for both career tracks)
- Recommendation scoring engine (rules-based formula from SPEC)
- Recommendation generation API endpoint
- LLM explanation generation (why this, why now, what it unlocks)
- Recommendation cards: title, platform, duration, difficulty, skills, explanation
- Save, dismiss, complete, rate actions
- Recommendations stored and served from DB (not re-generated on every page load)
- YouTube Data API v3 integration for additional resource discovery
**Requirements**: REQ-09, REQ-10, REQ-11

---

### Phase 5: Browser Extension (YouTube Overlay)
**Status**: Not Started
**Objective**: Chrome Manifest V3 extension built, packaged, and functional with a YouTube overlay showing personalized recommendations.
**Deliverables**:
- Chrome MV3 extension scaffold (manifest.json, content script, background service worker, popup)
- Supabase Auth integration in extension (persisted login state)
- YouTube watch page content script injecting Bloom overlay panel
- Overlay displays current user's top recommendations
- Extension popup showing quick stats (streak, current skill, next recommendation)
- Extension communicates with FastAPI backend via authenticated API calls
- Extension packaged for Chrome developer mode install
**Requirements**: REQ-12, REQ-13

---

### Phase 6: Learning Sessions + Progress Tracking
**Status**: Not Started
**Objective**: Learners can start, complete, and track learning sessions. Progress updates the roadmap and mastery estimates.
**Deliverables**:
- Learning session creation and completion recording
- Session timer (optional, user-controlled)
- Progress dashboard in web app: streak, skill nodes completed, roadmap position
- Mastery estimate updates on session completion
- Feedback submitted after session (rating + notes)
- Recommendation list refreshed after feedback
- "Continue Learning" and "Today's Learning" dashboard sections
**Requirements**: REQ-14, REQ-15, REQ-16

---

### Phase 7: Analytics + Feedback Loop
**Status**: Not Started
**Objective**: Analytics events tracked, feedback signals feed back into recommendation ranking, and basic metrics visible.
**Deliverables**:
- Analytics event table populated on all key actions (login, recommendation accepted/skipped, session started/completed, search performed)
- Feedback engine: explicit (save/dismiss/rate) + implicit (time spent, completion) signals
- Feedback-informed recommendation re-ranking
- Admin-facing (developer) metrics view: DAU, session completion rate, recommendation acceptance rate
- Structured logging in FastAPI (request ID, user ID, latency)
**Requirements**: REQ-17, REQ-18

---

### Phase 8: Polish + Launch Prep
**Status**: Not Started
**Objective**: Performance tuning, security audit, accessibility pass, error states, landing page, and production deployment.
**Deliverables**:
- Landing page (web app) with clear value proposition and sign-up CTA
- Error states and loading states on all screens
- Accessibility pass: keyboard navigation, focus states, contrast, screen reader labels
- API response caching (YouTube API responses, recommendations)
- Rate limiting on all API endpoints
- Security audit: no plaintext passwords, JWT expiry, RLS verified
- Production deployment: Vercel (FE) + Railway/Render (BE) + Supabase (DB)
- README updated with deployment instructions
- Chrome extension submitted to Chrome Web Store (or packaged for sideloading)
**Requirements**: REQ-19, REQ-20, REQ-21

---

## Milestone v2.0 Backlog (Post-MVP)

- Multi-platform integrations (GitHub, Kaggle, docs, blogs)
- Skill graph migrated to graph database (Neo4j or similar)
- Collaborative filtering recommendation layer
- AI Learning Coach (conversational)
- Mobile app
- Enterprise dashboards
- Creator marketplace
- Firefox extension support
