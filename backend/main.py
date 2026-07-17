from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Ensure the app directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.api import auth, onboarding, recommendations, sessions, feedback
except ImportError:
    auth = None
    onboarding = None
    recommendations = None
    sessions = None
    feedback = None


app = FastAPI(
    title="Bloom API",
    description="Backend service for the Bloom learning platform.",
    version="1.0.0",
)

# Allow CORS for development (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint to verify the service is running."""
    return {"status": "ok", "service": "bloom-backend"}

# Include routers
if auth:
    app.include_router(auth.router)
if onboarding:
    app.include_router(onboarding.router)
if recommendations:
    app.include_router(recommendations.router)
if sessions:
    app.include_router(sessions.router)
if feedback:
    app.include_router(feedback.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
