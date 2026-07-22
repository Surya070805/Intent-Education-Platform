from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Ensure the app directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.api import auth, onboarding, recommendations, sessions, feedback, roadmap, progress, profile, search, guard, coach


app = FastAPI(
    title="Bloom Intent Education Platform",
    description="Backend service for the Bloom learning platform.",
    version="1.0.0",
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint to verify the service is running."""
    return {"status": "ok", "service": "bloom-backend"}

# Register routers
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(recommendations.router)
app.include_router(sessions.router)
app.include_router(roadmap.router)
app.include_router(progress.router)
app.include_router(profile.router)
app.include_router(search.router)
app.include_router(guard.router)
app.include_router(coach.router)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
