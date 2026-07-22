from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api import search

app = FastAPI(title="Bloom Content Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "content-service"}

app.include_router(search.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("content:app", host="0.0.0.0", port=8004, reload=True)
