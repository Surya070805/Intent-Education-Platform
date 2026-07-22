from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api import sessions, progress, feedback, coach

app = FastAPI(title="Bloom Learning Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "learning-service"}

app.include_router(sessions.router)
app.include_router(progress.router)
app.include_router(feedback.router)
app.include_router(coach.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("learning:app", host="0.0.0.0", port=8002, reload=True)
