# SPEC.md — Bloom Project Specification

> **Status**: `FINALIZED`
> Last updated: 2026-07-17

---

## Vision

Bloom is an AI-powered career learning intelligence layer — not a course platform, LMS, or social network. It answers one question for every learner: **"What should I learn next, why now, and what does it unlock?"** The MVP delivers this through a browser extension that overlays personalized, explainable YouTube learning recommendations on top of existing browsing behavior, backed by a web companion for profile, roadmap, and progress tracking.

---

## Goals

1. **Prove the core recommendation loop** — A learner completes AI onboarding, receives a personalized roadmap, gets YouTube recommendations with AI explanations, and sees their progress update after each session.
2. **Launch with two career tracks** — Full-Stack Development and Data Science / ML / AI — with manually curated seed content and a skill graph for each.
3. **Ship a browser extension** as the primary UI surface, with a companion web app for profile, roadmap, and progress.
4. **Demonstrate explainability** — Every recommendation answers: why this resource, why now, which goal it supports, and what it unlocks next.
5. **Record feedback signals from day one** — Save, dismiss, complete, and rating events tracked so the recommendation model can improve.

---

## Non-Goals (Out of Scope for MVP)

- Mobile app
- Multi-platform integrations beyond YouTube (GitHub, Kaggle, podcasts, blogs, research papers)
- Enterprise dashboards or institutional cohort management
- Community features
- Creator marketplace
- Full conversational AI tutor or AI career coach
- Collaborative filtering (needs user data volume — deferred)
- Full graph database (use relational tables with skill prerequisites for now)
- Browser extension for browsers other than Chrome (Chromium-based first)
- Free vs Pro enforcement (show Pro teaser but no paywall at launch)

---

## Users

**Primary (MVP):**
- Undergraduate and graduate students
- Self-learners transitioning into tech
- Career switchers targeting software engineering or data science / AI
- Working professionals seeking structured upskilling

**Secondary (post-MVP):**
- Universities and bootcamps (institutional cohorts)
- Corporate learning teams
- Career coaches
- Enterprise learning departments

---

## Constraints

- **Technical**: Browser extension = Chromium-based (Chrome/Edge/Brave) only for MVP.
- **Technical**: YouTube Data API v3 free tier = 10,000 units/day — requires response caching.
- **Technical**: AI provider abstracted behind a `LLMProvider` wrapper — first implementation is OpenAI GPT-4o-mini.
- **Technical**: Supabase free tier limits: 500 MB database, 1 GB storage, 50,000 monthly active users.
- **Timeline**: MVP must validate the core recommendation loop before expanding scope.
- **Data**: No personal health data, payment data, or biometric data collected.
- **Privacy**: GDPR-compliant data collection, minimal by design.

---

## Tech Stack (Resolved)

| Layer | Choice |
|---|---|
| Browser Extension | Chrome Extension (Manifest V3), Vite + React |
| Web Companion App | Vite + React (SPA) |
| Backend | Python + FastAPI |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT + OAuth) |
| AI Provider | Abstracted wrapper -> OpenAI GPT-4o-mini (first) |
| YouTube | YouTube Data API v3 + manually curated seed library |
| Hosting | Vercel (FE) + Railway or Render (BE) + Supabase |
| Launch Career Tracks | Full-Stack Dev + Data Science / ML / AI |

---

## Core User Flow (MVP Loop)

1. Visitor opens Bloom web app or sees extension on YouTube.
2. User signs up or logs in (Supabase Auth).
3. AI onboarding captures: career goal, experience level, known skills, learning style, study time, language, objectives.
4. Bloom creates a **Learning Intent Profile** (stored in DB).
5. Bloom maps the learner to a career roadmap + skill graph.
6. Dashboard (web app) shows roadmap position, recommendations, streak, and progress.
7. Browser extension shows recommendation overlay when user browses YouTube.
8. User starts a learning session (clicks a recommendation).
9. User consumes resource, marks progress (complete / save / dismiss / rate).
10. Bloom records feedback, updates mastery estimates, refreshes recommendations.

**Every step in the loop must be atomic and recoverable.**

---

## Success Criteria

- [ ] A new user can register, complete onboarding, and receive a personalized roadmap in under 5 minutes.
- [ ] At least 3 personalized YouTube recommendations are generated on first login with AI explanations.
- [ ] Every recommendation card shows: title, platform, duration, difficulty, skills covered, and an AI-generated explanation answering "why this, why now, what it unlocks."
- [ ] Learner can save, dismiss, complete, and rate a recommendation.
- [ ] Progress persists across sessions and is visible on the dashboard.
- [ ] Browser extension installs cleanly from a packaged .crx or developer mode.
- [ ] Extension overlay is visible and usable on YouTube watch pages.
- [ ] Backend API responses under 200ms (excluding external API calls).
- [ ] Supabase RLS enforces per-user data isolation.
- [ ] No plaintext passwords stored anywhere.

---

## Recommendation Scoring Formula (MVP)

```
score = (skill_gap_relevance * 0.40)
      + (difficulty_match    * 0.25)
      + (content_quality     * 0.20)
      + (duration_fit        * 0.10)
      + (freshness           * 0.05)
```

Explanation text generated by LLM after scoring — not inline with ranking.

---

## Feature Gating

- **Free tier**: Fully functional MVP features.
- **Pro teaser**: Visible but locked with "Coming Soon" badge. No payment enforcement at launch.
- **Pro candidates (future)**: Advanced AI coach, custom roadmap editor, team dashboards, priority support.
