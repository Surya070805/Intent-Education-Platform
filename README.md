# Bloom Project Repository

## Repository Layout

- **extension/** – Chrome MV3 extension source (Vite + React)
- **web/** – Companion web application (Vite + React)
- **backend/** – FastAPI backend service
- **.gsd/** – GSD documentation, specs, roadmap, plans, state, etc.
- **.github/workflows/** – CI pipeline definitions
- **.gitignore** – Standard ignore file (already present)

Each subproject is a standalone Vite/React SPA that can be built and served independently. The backend provides API endpoints for authentication, onboarding, recommendations, and analytics.

## Local Development Setup

### 1. Supabase Setup
Create a new Supabase project. You will need the `Project URL` and `anon key`.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env     # Fill in your Supabase & OpenAI credentials
uvicorn main:app --reload
```

### 3. Web Setup
```bash
cd web
npm install
cp .env.example .env     # Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### 4. Extension Setup
```bash
cd extension
npm install
cp .env.example .env     # Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run build
```
Load the extension in Chrome: Navigate to `chrome://extensions`, enable "Developer mode", and load the `extension/dist` folder (or whatever the outDir is set to).
