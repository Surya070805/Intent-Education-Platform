from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.security import get_current_user, User, supabase
from app.services.mastery_engine import update_mastery

router = APIRouter(prefix="/api/v1/sessions", tags=["Sessions"])

class StartSessionRequest(BaseModel):
    recommendation_id: str

class EndSessionRequest(BaseModel):
    duration_seconds: int
    rating: Optional[int] = None  # 1-5 star rating from user

@router.post("/start")
async def start_session(
    request: StartSessionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Initializes a new learning session for a resource.
    """
    if not supabase:
        return {"id": "mock-session-123", "status": "mock"}

    try:
        # Fetch resource_id from recommendation
        rec_res = supabase.table("recommendations").select("resource_id").eq("id", request.recommendation_id).execute()
        resource_id = rec_res.data[0]["resource_id"] if rec_res.data else None

        session_data = {
            "user_id": current_user.id,
            "resource_id": resource_id,
            "recommendation_id": request.recommendation_id,
            "started_at": datetime.utcnow().isoformat(),
            "status": "active",
        }
        res = supabase.table("learning_sessions").insert(session_data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    request: EndSessionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Marks a session as completed, logs duration, and triggers the
    Mastery Engine to update the learner's skill mastery levels.
    """
    if not supabase:
        return {"status": "mock_success", "duration_logged": request.duration_seconds}

    try:
        # 1. Fetch the session to get resource_id
        session_res = supabase.table("learning_sessions") \
            .select("resource_id") \
            .eq("id", session_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not session_res.data:
            raise HTTPException(status_code=404, detail="Session not found")

        resource_id = session_res.data[0].get("resource_id")

        # 2. Mark session as completed
        res = supabase.table("learning_sessions") \
            .update({
                "completed_at": datetime.utcnow().isoformat(),
                "duration_seconds": request.duration_seconds,
                "status": "completed",
            }) \
            .eq("id", session_id) \
            .eq("user_id", current_user.id) \
            .execute()

        session = res.data[0] if res.data else {}

        # 3. Fire the Mastery Engine — update learner's skill knowledge
        mastery_updates = []
        if resource_id:
            mastery_updates = await update_mastery(
                user_id=current_user.id,
                resource_id=resource_id,
                duration_watched_seconds=request.duration_seconds,
                rating=request.rating,
            )

        return {
            **session,
            "mastery_updates": mastery_updates,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active")
async def get_active_sessions(current_user: User = Depends(get_current_user)):
    """
    Returns sessions that were started but not completed (for Continue Learning).
    """
    if not supabase:
        return []

    try:
        res = supabase.table("learning_sessions") \
            .select("*, resource:resources(title, thumbnail_url, youtube_id, channel_name, duration_seconds)") \
            .eq("user_id", current_user.id) \
            .eq("status", "active") \
            .order("started_at", desc=True) \
            .limit(5) \
            .execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/revisions")
async def get_revision_sessions(current_user: User = Depends(get_current_user)):
    """
    Returns completed sessions for spaced repetition / revision.
    Currently returns the most recently completed sessions.
    (Could be enhanced to prioritize low-rated sessions from feedback).
    """
    if not supabase:
        return []
        
    try:
        # Fetch completed sessions with resource
        res = supabase.table("learning_sessions") \
            .select("*, resource:resources(title, thumbnail_url, youtube_id, channel_name, duration_seconds)") \
            .eq("user_id", current_user.id) \
            .eq("status", "completed") \
            .order("completed_at", desc=True) \
            .limit(5) \
            .execute()
            
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
