from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.security import get_current_user, User, supabase

router = APIRouter(prefix="/api/v1/sessions", tags=["Sessions"])

class StartSessionRequest(BaseModel):
    resource_id: str

class EndSessionRequest(BaseModel):
    duration_seconds: int

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
        session_data = {
            "user_id": current_user.id,
            "resource_id": request.resource_id,
            "start_time": datetime.utcnow().isoformat(),
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
    Updates the end_time and calculated duration.
    """
    if not supabase:
        return {"status": "mock_success", "duration_logged": request.duration_seconds}

    try:
        res = supabase.table("learning_sessions") \
            .update({
                "end_time": datetime.utcnow().isoformat(),
                "duration_seconds": request.duration_seconds
            }) \
            .eq("id", session_id) \
            .eq("user_id", current_user.id) \
            .execute()
        return res.data[0] if res.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
