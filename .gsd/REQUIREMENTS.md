# REQUIREMENTS.md — Bloom MVP Requirements

> Generated from SPEC.md goals.
> Each requirement is testable and maps to a SPEC goal.

---

## Requirements Table

| ID | Requirement | Source | Phase | Status |
|----|-------------|--------|-------|--------|
| REQ-01 | Project monorepo structure exists with `/extension`, `/web`, `/backend` directories | SPEC Goal 3 | Phase 1 | Pending |
| REQ-02 | Local development environment documented and reproducible from README | SPEC Goal 3 | Phase 1 | Pending |
| REQ-03 | User can register with email/password and receive a verified session | SPEC Goal 1 | Phase 2 | Pending |
| REQ-04 | User can log in with Google OAuth | SPEC Goal 1 | Phase 2 | Pending |
| REQ-05 | All database tables exist with RLS policies enforcing per-user data access | SPEC Success Criteria | Phase 2 | Pending |
| REQ-06 | Multi-step onboarding flow captures: career goal, experience, known skills, learning style, daily study time, preferred language | SPEC Core User Flow | Phase 3 | Pending |
| REQ-07 | Learning Intent Profile is generated and stored on onboarding completion | SPEC Core User Flow | Phase 3 | Pending |
| REQ-08 | Initial career roadmap and skill graph position are generated after onboarding | SPEC Core User Flow | Phase 3 | Pending |
| REQ-09 | At least 3 personalized YouTube recommendations are generated on first login | SPEC Success Criteria | Phase 4 | Pending |
| REQ-10 | Each recommendation card shows: title, platform, duration, difficulty, skills covered, AI explanation | SPEC Success Criteria | Phase 4 | Pending |
| REQ-11 | Learner can save, dismiss, complete, and rate a recommendation | SPEC Success Criteria | Phase 4 | Pending |
| REQ-12 | Chrome MV3 extension installs from developer mode with no errors | SPEC Success Criteria | Phase 5 | Pending |
| REQ-13 | Extension overlay is visible and interactive on YouTube watch pages | SPEC Success Criteria | Phase 5 | Pending |
| REQ-14 | Learning session can be started, timed, and marked complete | SPEC Core User Flow | Phase 6 | Pending |
| REQ-15 | Progress persists across sessions and is visible on the dashboard | SPEC Success Criteria | Phase 6 | Pending |
| REQ-16 | Mastery estimates update after session completion and feedback | SPEC Goal 5 | Phase 6 | Pending |
| REQ-17 | Analytics events are recorded for all key user actions | SPEC Events section | Phase 7 | Pending |
| REQ-18 | Feedback signals (save/dismiss/rate) influence next recommendation generation | SPEC Goal 5 | Phase 7 | Pending |
| REQ-19 | Backend API responses under 200ms for read operations (excluding external API latency) | SPEC Constraints | Phase 8 | Pending |
| REQ-20 | No plaintext passwords stored; all tokens expire; HTTPS enforced | SPEC Success Criteria | Phase 8 | Pending |
| REQ-21 | Application is deployed and accessible in production (Vercel + Railway + Supabase) | SPEC Goal 3 | Phase 8 | Pending |
