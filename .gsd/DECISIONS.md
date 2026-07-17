# DECISIONS.md — Architecture Decision Records (ADR)

> Log of all significant technical and product decisions made during Bloom development.
> Format: Context → Decision → Consequences

---

## ADR-001: Browser Extension First (not Web App First)

**Date**: 2026-07-17
**Status**: Accepted

**Context**: The business strategy documents emphasize browser extension as the primary surface. Architecture docs allow both a web app and extension. A decision had to be made for MVP focus.

**Decision**: Build a Chrome Manifest V3 browser extension as the primary UI. The web app is the companion surface for profile, roadmap, and progress.

**Consequences**:
- Extension content scripts handle YouTube page injection.
- Web app is the settings/dashboard surface — linked from the extension popup.
- Extension architecture (MV3 service worker + content scripts) must be understood by all FE contributors.
- Restricts MVP to Chromium-based browsers only.

---

## ADR-002: Vite + React for Frontend (Extension + Web App)

**Date**: 2026-07-17
**Status**: Accepted

**Context**: Frontend framework choice needed. Next.js was considered but SSR is not needed for a browser extension. The extension popup and content script UI are pure client-side.

**Decision**: Vite + React for both the extension UI and the companion web app.

**Consequences**:
- Shared component library possible between extension and web app.
- No SSR / SSG complexity for MVP.
- Fast local dev experience.
- SEO is not critical at MVP stage (web app is behind auth).

---

## ADR-003: Python + FastAPI for Backend

**Date**: 2026-07-17
**Status**: Accepted

**Context**: Backend needs to integrate with LLM providers, recommendation pipelines, and the YouTube API. Python is the dominant language for AI/ML tooling.

**Decision**: Python + FastAPI.

**Consequences**:
- Auto-generated OpenAPI docs at `/docs`.
- Async-native for concurrent recommendation generation.
- Easy integration with LangChain, OpenAI SDK, and data libraries.
- Requires Python packaging discipline (use `uv` or `pip` with `requirements.txt`).

---

## ADR-004: Supabase for Database + Auth

**Date**: 2026-07-17
**Status**: Accepted

**Context**: Separate database and auth services would require more configuration. Supabase bundles PostgreSQL + Auth + Storage + Edge Functions.

**Decision**: Supabase for managed PostgreSQL and Supabase Auth for JWT-based auth with OAuth support.

**Consequences**:
- Row-Level Security (RLS) enforced at DB layer — FastAPI validates JWT, Supabase enforces per-user data access.
- Free tier: 500 MB DB, 1 GB storage, 50k MAU.
- Vendor dependency on Supabase — mitigated by standard PostgreSQL underneath.
- DB migrations managed via Supabase CLI or raw SQL files in `/backend/migrations/`.

---

## ADR-005: Abstracted LLMProvider Wrapper

**Date**: 2026-07-17
**Status**: Accepted

**Context**: Committing to a single AI provider creates vendor lock-in. Provider pricing and performance change frequently.

**Decision**: Build a `LLMProvider` abstract base class. First implementation: OpenAI GPT-4o-mini.

**Consequences**:
- Business logic never imports OpenAI SDK directly.
- Swapping to Gemini, Claude, or Groq requires only a new concrete implementation.
- Adds one layer of indirection — acceptable for production quality.

---

## ADR-006: Rules-Based Scoring + LLM Explanations for Recommendations

**Date**: 2026-07-17
**Status**: Accepted

**Context**: Pure LLM ranking is slow and expensive. Collaborative filtering requires historical data (cold-start problem). MVP needs something that works on day one with curated seed data.

**Decision**: Deterministic rules-based scoring formula generates ranked candidates. LLM then generates a human-readable explanation for the top-N recommendations.

**Scoring formula**:
```
score = (skill_gap_relevance * 0.40)
      + (difficulty_match    * 0.25)
      + (content_quality     * 0.20)
      + (duration_fit        * 0.10)
      + (freshness           * 0.05)
```

**Consequences**:
- Fully explainable, deterministic ranking (no black box).
- LLM cost only incurred for explanation generation (not ranking).
- Formula weights are educated guesses — must be tuned with feedback data.
- Collaborative filtering can be layered on top post-MVP.

---

## ADR-007: Two Career Tracks at Launch

**Date**: 2026-07-17
**Status**: Accepted

**Context**: More career tracks = more skill graph data to curate. Fewer tracks = better quality recommendations. Two tracks covers the largest learner demand with manageable curation effort.

**Decision**: Launch with Full-Stack Development and Data Science / ML / AI only.

**Consequences**:
- Focused content curation effort before launch.
- Recommendation quality is high for both tracks (no thin data).
- Learners with other goals (DevOps, Design, Finance) cannot be fully served at MVP.
- Additional tracks added in Phase 8 / v2.0.

---

## ADR-008: YouTube Data API v3 + Manual Seed Curation

**Date**: 2026-07-17
**Status**: Accepted

**Context**: Fully manual curation is high-effort and doesn't scale. Pure API search has a 10,000 unit/day limit and cold-start quality issues. Hybrid gives best of both.

**Decision**: Manually curate seed resource library for both launch career tracks. Use YouTube Data API v3 for dynamic content discovery. Cache all API responses.

**Consequences**:
- Seed library ensures recommendation quality from day one.
- API cache reduces quota consumption.
- Seed content becomes stale over time — requires periodic manual refresh.
- API quota monitoring needed.
