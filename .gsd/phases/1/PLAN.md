---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Project Foundation Scaffold

## Objective
Create the foundational monorepo structure, bootstrap Vite+React applications for the Chrome extension and companion web app, scaffold a FastAPI backend, and configure a basic CI pipeline.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md (Phase 1: Project Foundation)
- No existing codebase to integrate.

## Tasks

<task type="auto">
  <name>Create monorepo directories and README</name>
  <files>.gsd/phases/1/README.md</files>
  <action>
    - mkdir extension web backend
    - add a top‑level README.md describing the repo layout
  </action>
  <verify>Check that the directories exist and README contains the three top‑level sections.</verify>
  <done>Directories created and README committed.</done>
</task>

<task type="auto">
  <name>Bootstrap Vite+React apps</name>
  <files>extension/package.json, web/package.json</files>
  <action>
    - Run `npm create vite@latest extension -- --template react` (install dependencies)
    - Run `npm create vite@latest web -- --template react` (install dependencies)
    - Ensure both apps build with `npm run dev` locally.
  </action>
  <verify>Both `npm run dev` commands start without errors and serve on ports.</verify>
  <done>Vite+React apps scaffolded and runnable.</done>
</task>

<task type="auto">
  <name>Scaffold FastAPI backend</name>
  <files>backend/main.py, backend/requirements.txt</files>
  <action>
    - Create `backend/main.py` with a minimal FastAPI app exposing `/health`.
    - Add `uvicorn` as a dev server in `requirements.txt`.
    - Verify `uvicorn backend.main:app --reload` runs.
  </action>
  <verify>GET `/api/v1/health` returns 200 OK.</verify>
  <done>FastAPI skeleton ready.</done>
</task>

## Success Criteria
- Monorepo with three subfolders (`extension`, `web`, `backend`) exists.
- Both Vite apps start with `npm run dev`.
- FastAPI `/health` endpoint returns 200.
- CI workflow file `.github/workflows/ci.yml` added (lint + type‑check) and passes on push.

---

## Verification Plan
### Automated Tests
- Run `npm run lint` for each Vite app.
- Run `pytest` in `backend` (no tests yet, but ensure import works).
- Run CI pipeline locally with `act` or GitHub Actions preview.

### Manual Verification
- Open the extension dev server in Chrome via `chrome://extensions` → Load unpacked.
- Open the web app in a browser and verify the home page renders.
- Hit the FastAPI health endpoint.
